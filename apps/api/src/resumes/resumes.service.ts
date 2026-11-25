import { isDeepStrictEqual } from "node:util";
import { resolveResume } from "@ogma/contracts/resolve-resume";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import {
  resumeDocumentSchema,
  type ResumeDocument,
  type ResumeSummary,
} from "@ogma/contracts/resume-workspace";
import { DatabaseService } from "../database/database.service";
import { DocumentPrototypeService } from "../document-prototype/document-prototype.service";
import type { Prisma, Resume } from "../generated/ogma/client";
import { getResumeLayout } from "../resume-layouts/layout-catalog";
import { layoutDraftSchema } from "../resume-layouts/layout-draft";
import { paginateResume } from "../resume-layouts/paginate-resume";
import { renderResumeLayout } from "../resume-layouts/render-resume-layout";
import { assertResumeUnlocked } from "./resume-lock";

const blankDocument: ResumeDocument = {
  schemaVersion: 1,
  layoutId: "classic",
  settings: {},
  hidden: [],
  content: {
    contact: {
      firstName: "",
      lastName: "",
      pronouns: "",
      email: "",
      linkedin: "",
      address: "",
      phone: "",
      website: "",
      github: "",
    },
    targetTitle: "",
    summary: "",
    experience: [],
    education: [],
    skills: [],
    certifications: [],
    awards: [],
    projects: [],
    volunteering: [],
    publications: [],
  },
};

function validateLayouts(document: ResumeDocument) {
  if (
    !getResumeLayout(document.layoutId) ||
    Object.keys(document.settings).some((id) => !getResumeLayout(id))
  )
    throw new BadRequestException("Unknown resume template.");
}

function isBlankResume(document: ResumeDocument) {
  return (
    !document.photo &&
    isDeepStrictEqual(document.content, blankDocument.content)
  );
}

function summary(resume: Resume, document: ResumeDocument): ResumeSummary {
  return {
    id: resume.id,
    title: resume.title,
    draftRevision: resume.draftRevision,
    updatedAt: resume.updatedAt.toISOString(),
    archived: Boolean(resume.archivedAt),
    locked: resume.locked,
    pageCount: resume.pageCount ?? (isBlankResume(document) ? 1 : null),
    templateName:
      getResumeLayout(document.layoutId)?.name ?? "Unknown template",
    paper:
      document.settings[document.layoutId]?.paperSize === "letter"
        ? "Letter"
        : "A4",
  };
}

function saved(resume: Resume) {
  const document = resumeDocumentSchema.parse(resume.document);
  return { ...summary(resume, document), document };
}

function renderSnapshot(document: ResumeDocument, revision: number) {
  const layout = getResumeLayout(document.layoutId);
  if (!layout) throw new BadRequestException("Unknown resume template.");
  return {
    draft: layoutDraftSchema.parse(resolveResume(document, layout)),
    layout,
    revision,
  };
}

@Injectable()
export class ResumesService {
  constructor(
    private readonly database: DatabaseService,
    private readonly documents: DocumentPrototypeService,
  ) {}

  async list(ownerId: string, archived: boolean) {
    const resumes = await this.database.resume.findMany({
      where: { ownerId, archivedAt: archived ? { not: null } : null },
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
    });
    return resumes.map((resume) =>
      summary(resume, resumeDocumentSchema.parse(resume.document)),
    );
  }

  private async findActive(ownerId: string, id: string) {
    const resume = await this.database.resume.findUnique({
      where: { id, ownerId, archivedAt: null },
    });
    if (!resume) throw new NotFoundException("Resume not found.");
    return resume;
  }

  async get(ownerId: string, id: string) {
    return saved(await this.findActive(ownerId, id));
  }

  async getRenderSnapshot(
    ownerId: string,
    id: string,
    expectedRevision?: number,
  ) {
    const resume = await this.findActive(ownerId, id);
    if (
      expectedRevision !== undefined &&
      resume.draftRevision !== expectedRevision
    )
      throw new ConflictException("This resume changed elsewhere.");
    return renderSnapshot(
      resumeDocumentSchema.parse(resume.document),
      resume.draftRevision,
    );
  }

  async getPageCount(ownerId: string, id: string) {
    const resume = await this.database.resume.findUnique({
      where: { id, ownerId },
    });
    if (!resume) throw new NotFoundException("Resume not found.");
    const { draftRevision } = resume;
    if (resume.pageCount !== null)
      return { pageCount: resume.pageCount, draftRevision };
    const document = resumeDocumentSchema.parse(resume.document);
    if (isBlankResume(document)) return { pageCount: 1, draftRevision };
    const { draft, layout } = renderSnapshot(document, draftRevision);
    const pageCount = await this.documents.countPages(
      renderResumeLayout(draft, layout),
      paginateResume,
    );
    if (pageCount < 1)
      throw new ServiceUnavailableException("Couldn’t measure the resume.");
    await this.database.resume.updateMany({
      where: { id, ownerId, draftRevision },
      data: { pageCount, updatedAt: resume.updatedAt },
    });
    return { pageCount, draftRevision };
  }

  private async insert(
    database: Prisma.TransactionClient,
    ownerId: string,
    id: string,
    title: string,
    document: ResumeDocument,
  ) {
    validateLayouts(document);
    await database.resume.createMany({
      data: {
        id,
        ownerId,
        title,
        document: JSON.parse(JSON.stringify(document)),
      },
      skipDuplicates: true,
    });
    const resume = await database.resume.findUnique({ where: { id, ownerId } });
    if (!resume) throw new ConflictException("The resume ID is unavailable.");
    return saved(resume);
  }

  async create(
    ownerId: string,
    id: string,
    title: string,
    document = blankDocument,
  ) {
    return this.database.$transaction((transaction) =>
      this.insert(transaction, ownerId, id, title, document),
    );
  }

  async duplicate(ownerId: string, sourceId: string, id: string) {
    if (sourceId === id)
      throw new BadRequestException("Choose a new resume ID.");
    return this.database.$transaction(async (transaction) => {
      const existing = await transaction.resume.findUnique({
        where: { id, ownerId },
      });
      if (existing) return saved(existing);
      const source = await transaction.resume.findUnique({
        where: { id: sourceId, ownerId, archivedAt: null },
      });
      if (!source) throw new NotFoundException("Resume not found.");
      const document = resumeDocumentSchema.parse(source.document);
      return this.insert(
        transaction,
        ownerId,
        id,
        `${source.title.slice(0, 113)} (copy)`,
        document,
      );
    });
  }

  async save(
    ownerId: string,
    id: string,
    expectedRevision: number,
    title: string,
    document: ResumeDocument,
  ) {
    validateLayouts(document);
    const [updated] = await this.database.resume.updateManyAndReturn({
      where: {
        id,
        ownerId,
        archivedAt: null,
        locked: false,
        draftRevision: expectedRevision,
      },
      data: {
        title,
        document: JSON.parse(JSON.stringify(document)),
        draftRevision: { increment: 1 },
        pageCount: null,
      },
    });
    if (updated) return summary(updated, document);

    const current = await this.findActive(ownerId, id);
    assertResumeUnlocked(current);
    if (
      current.title === title &&
      isDeepStrictEqual(resumeDocumentSchema.parse(current.document), document)
    )
      return summary(current, document);
    throw new ConflictException("This resume changed elsewhere.");
  }

  async setLocked(
    ownerId: string,
    id: string,
    expectedRevision: number,
    locked: boolean,
    changes?: { title: string; document: ResumeDocument },
  ) {
    if (changes) validateLayouts(changes.document);
    const [updated] = await this.database.resume.updateManyAndReturn({
      where: {
        id,
        ownerId,
        archivedAt: null,
        draftRevision: expectedRevision,
        locked: !locked,
      },
      data: {
        locked,
        draftRevision: { increment: 1 },
        ...(changes
          ? {
              title: changes.title,
              document: JSON.parse(JSON.stringify(changes.document)),
              pageCount: null,
            }
          : {}),
      },
    });
    if (updated)
      return summary(updated, resumeDocumentSchema.parse(updated.document));
    const current = await this.findActive(ownerId, id);
    if (
      current.locked === locked &&
      (current.draftRevision === expectedRevision ||
        current.draftRevision === expectedRevision + 1) &&
      (!changes ||
        (current.title === changes.title &&
          isDeepStrictEqual(
            resumeDocumentSchema.parse(current.document),
            changes.document,
          )))
    )
      return summary(current, resumeDocumentSchema.parse(current.document));
    throw new ConflictException("This resume changed elsewhere.");
  }

  async setArchived(ownerId: string, id: string, archived: boolean) {
    await this.database.resume.updateMany({
      where: { id, ownerId, archivedAt: archived ? null : { not: null } },
      data: {
        archivedAt: archived ? new Date() : null,
        draftRevision: { increment: 1 },
      },
    });
    const resume = await this.database.resume.findUnique({
      where: { id, ownerId },
    });
    if (!resume) throw new NotFoundException("Resume not found.");
    return summary(resume, resumeDocumentSchema.parse(resume.document));
  }

  async deleteArchived(ownerId: string, id: string, expectedRevision: number) {
    const result = await this.database.resume.deleteMany({
      where: {
        id,
        ownerId,
        archivedAt: { not: null },
        draftRevision: expectedRevision,
      },
    });
    if (result.count) return;
    const existing = await this.database.resume.findUnique({
      where: { id, ownerId },
      select: { id: true },
    });
    if (existing)
      throw new ConflictException(
        "The resume changed. Reload your archive and try again.",
      );
  }
}
