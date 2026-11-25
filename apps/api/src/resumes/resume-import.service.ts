import {
  ConflictException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import type { ResumeDocument } from "@ogma/contracts/resume-workspace";
import type { LibraryEntryContent } from "@ogma/contracts/content-library";
import { DatabaseService } from "../database/database.service";
import { Prisma } from "../generated/ogma/client";
import { ResumesService } from "./resumes.service";
import { getResumeLayout } from "../resume-layouts/layout-catalog";

@Injectable()
export class ResumeImportService {
  constructor(
    private readonly database: DatabaseService,
    private readonly resumes: ResumesService,
  ) {}

  async commit(
    ownerId: string,
    id: string,
    title: string,
    document: ResumeDocument,
    libraryEntries: { id: string; content: LibraryEntryContent }[],
  ) {
    if (
      !getResumeLayout(document.layoutId) ||
      Object.keys(document.settings).some((key) => !getResumeLayout(key))
    )
      throw new ConflictException("Choose an available template.");
    try {
      await this.database.$transaction(async (transaction) => {
        // The new resume ID is also the import's idempotency key.
        await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${id}, 0))`;
        const existing = await transaction.resume.findUnique({ where: { id } });
        if (existing) {
          if (existing.ownerId !== ownerId)
            throw new ConflictException("Choose a new import ID.");
          return;
        }
        await transaction.resume.create({
          data: {
            id,
            ownerId,
            title,
            document: JSON.parse(JSON.stringify(document)),
          },
        });
        for (const entry of libraryEntries) {
          await transaction.libraryEntry.create({
            data: {
              id: entry.id,
              ownerId,
              kind: entry.content.kind,
              revisions: {
                create: {
                  revision: 1,
                  content: JSON.parse(JSON.stringify(entry.content)),
                },
              },
            },
          });
        }
      });
    } catch (cause) {
      if (
        cause instanceof Prisma.PrismaClientKnownRequestError &&
        cause.code === "P2002"
      )
        throw new ConflictException(
          "A Library section already exists. Import the CV without adding Library entries, then use the editor’s Library actions to review updates.",
        );
      if (cause instanceof ConflictException) throw cause;
      throw new ServiceUnavailableException(
        "The reviewed import could not be saved. Retry this submission when the database is available.",
      );
    }
    return this.resumes.get(ownerId, id);
  }
}
