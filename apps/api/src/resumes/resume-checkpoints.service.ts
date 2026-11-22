import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { resolveResume } from "@ogma/contracts/resolve-resume";
import { resumeDocumentSchema } from "@ogma/contracts/resume-workspace";
import { DatabaseService } from "../database/database.service";
import { getResumeLayout } from "../resume-layouts/layout-catalog";
import { layoutDraftSchema } from "../resume-layouts/layout-draft";
import { assertResumeUnlocked } from "./resume-lock";

const checkpointFields = {
  id: true,
  name: true,
  createdAt: true,
  draftRevision: true,
} as const;

@Injectable()
export class ResumeCheckpointsService {
  constructor(private readonly database: DatabaseService) {}

  list(ownerId: string, resumeId: string) {
    return this.database.resumeCheckpoint.findMany({
      where: { resumeId, resume: { ownerId, archivedAt: null } },
      select: checkpointFields,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    });
  }

  create(
    ownerId: string,
    resumeId: string,
    id: string,
    name: string,
    expectedRevision: number,
  ) {
    return this.database.$transaction(async (transaction) => {
      const where = { id, resumeId, resume: { ownerId } };
      const existing = await transaction.resumeCheckpoint.findUnique({
        where,
        select: checkpointFields,
      });
      if (existing) return existing;
      const resume = await transaction.resume.findUnique({
        where: { id: resumeId, ownerId, archivedAt: null },
      });
      if (!resume) throw new NotFoundException("Resume not found.");
      if (resume.draftRevision !== expectedRevision)
        throw new ConflictException("This resume changed elsewhere.");
      const document = resumeDocumentSchema.parse(resume.document);
      const layout = getResumeLayout(document.layoutId);
      if (!layout) throw new BadRequestException("Unknown resume template.");
      const resolved = layoutDraftSchema.parse(resolveResume(document, layout));
      await transaction.resumeCheckpoint.createMany({
        data: {
          id,
          resumeId,
          name,
          resumeTitle: resume.title,
          draftRevision: expectedRevision,
          document: JSON.parse(JSON.stringify(document)),
          resolved: JSON.parse(JSON.stringify(resolved)),
        },
        skipDuplicates: true,
      });
      const checkpoint = await transaction.resumeCheckpoint.findUnique({
        where,
        select: checkpointFields,
      });
      if (!checkpoint)
        throw new ConflictException("The checkpoint ID is unavailable.");
      return checkpoint;
    });
  }

  restore(
    ownerId: string,
    resumeId: string,
    checkpointId: string,
    id: string,
    expectedRevision: number,
  ) {
    return this.database.$transaction(async (transaction) => {
      const checkpoint = await transaction.resumeCheckpoint.findUnique({
        where: {
          id: checkpointId,
          resumeId,
          resume: { ownerId, archivedAt: null },
        },
      });
      if (!checkpoint) throw new NotFoundException("Checkpoint not found.");
      const draftRevision = expectedRevision + 1;
      const marker = await transaction.resumeCheckpointRestore.createMany({
        data: { id, checkpointId, draftRevision },
        skipDuplicates: true,
      });
      if (!marker.count) {
        const previous = await transaction.resumeCheckpointRestore.findUnique({
          where: { id, checkpointId },
          select: { draftRevision: true },
        });
        if (!previous)
          throw new ConflictException("The restore ID is unavailable.");
        return previous;
      }
      const result = await transaction.resume.updateMany({
        where: {
          id: resumeId,
          ownerId,
          archivedAt: null,
          draftRevision: expectedRevision,
          locked: false,
        },
        data: {
          title: checkpoint.resumeTitle,
          document: JSON.parse(
            JSON.stringify(resumeDocumentSchema.parse(checkpoint.document)),
          ),
          draftRevision,
          pageCount: null,
        },
      });
      if (!result.count) {
        const current = await transaction.resume.findUnique({
          where: { id: resumeId, ownerId, archivedAt: null },
        });
        if (current) assertResumeUnlocked(current);
        throw new ConflictException("This resume changed elsewhere.");
      }
      return { draftRevision };
    });
  }
}
