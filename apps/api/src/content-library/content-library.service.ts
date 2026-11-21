import { isDeepStrictEqual } from "node:util";
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  libraryEntryContentSchema,
  type LibraryEntry,
  type LibraryEntryContent,
} from "@ogma/contracts/content-library";
import { DatabaseService } from "../database/database.service";
import {
  Prisma,
  type LibraryEntry as StoredEntry,
} from "../generated/database/client";

const latestRevision = {
  revisions: { orderBy: { revision: "desc" }, take: 1 },
} satisfies Prisma.LibraryEntryInclude;

function revisionContent(content: LibraryEntryContent): Prisma.InputJsonObject {
  // Library content was already validated as JSON by the shared schema.
  return JSON.parse(JSON.stringify(content)) as Prisma.InputJsonObject;
}

function present(
  entry: StoredEntry & { revisions: { content: unknown }[] },
): LibraryEntry {
  return {
    id: entry.id,
    revision: entry.currentRevision,
    archived: entry.archivedAt !== null,
    updatedAt: entry.updatedAt.toISOString(),
    content: libraryEntryContentSchema.parse(entry.revisions[0]?.content),
  };
}

@Injectable()
export class ContentLibraryService {
  constructor(private readonly database: DatabaseService) {}

  async list(ownerId: string, archived: boolean) {
    const entries = await this.database.$transaction(
      (transaction) =>
        transaction.libraryEntry.findMany({
          where: { ownerId, archivedAt: archived ? { not: null } : null },
          orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
          include: latestRevision,
        }),
      { isolationLevel: "RepeatableRead" },
    );
    return entries.map(present);
  }

  async status(ownerId: string) {
    const entry = await this.database.libraryEntry.findFirst({
      where: { ownerId, archivedAt: null },
      select: { id: true },
    });
    return { hasEntries: Boolean(entry) };
  }

  async create(ownerId: string, id: string, content: LibraryEntryContent) {
    try {
      const entry = await this.database.libraryEntry.create({
        data: {
          id,
          ownerId,
          kind: content.kind,
          revisions: {
            create: { revision: 1, content: revisionContent(content) },
          },
        },
        include: latestRevision,
      });
      return present(entry);
    } catch (error) {
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== "P2002"
      )
        throw error;
      return this.database.$transaction(
        async (transaction) => {
          const entry = await transaction.libraryEntry.findUnique({
            where: { id, ownerId },
            include: latestRevision,
          });
          const initial =
            entry &&
            (await transaction.libraryEntryRevision.findUnique({
              where: { entryId_revision: { entryId: id, revision: 1 } },
              select: { content: true },
            }));
          if (
            !entry ||
            !initial ||
            !isDeepStrictEqual(initial.content, content)
          )
            throw new ConflictException(
              "An active Library entry already exists for this master section or ID.",
            );
          return present(entry);
        },
        { isolationLevel: "RepeatableRead" },
      );
    }
  }

  update(
    ownerId: string,
    id: string,
    expectedRevision: number,
    content: LibraryEntryContent,
  ) {
    return this.database.$transaction(async (transaction) => {
      // Serialize entry changes so repeated saves cannot create duplicate revisions.
      await transaction.$queryRaw`SELECT id FROM library_entries WHERE id = ${id}::uuid AND owner_id = ${ownerId}::uuid FOR UPDATE`;
      const existing = await transaction.libraryEntry.findUnique({
        where: { id, ownerId, archivedAt: null },
        include: latestRevision,
      });
      if (!existing) await this.rejectChange(transaction, ownerId, id);
      if (
        existing &&
        isDeepStrictEqual(
          existing.revisions[0]?.content,
          revisionContent(content),
        )
      )
        return present(existing);
      const updated = await transaction.libraryEntry.updateMany({
        where: {
          id,
          ownerId,
          currentRevision: expectedRevision,
          kind: content.kind,
          archivedAt: null,
        },
        data: { currentRevision: { increment: 1 } },
      });
      if (!updated.count) await this.rejectChange(transaction, ownerId, id);
      await transaction.libraryEntryRevision.create({
        data: {
          entryId: id,
          revision: expectedRevision + 1,
          content: revisionContent(content),
        },
      });
      return present(
        await transaction.libraryEntry.findUniqueOrThrow({
          where: { id, ownerId },
          include: latestRevision,
        }),
      );
    });
  }

  archive(
    ownerId: string,
    id: string,
    expectedRevision: number,
    archived: boolean,
  ) {
    return this.database
      .$transaction(async (transaction) => {
        const entry = await transaction.libraryEntry.findUnique({
          where: { id, ownerId },
          include: latestRevision,
        });
        if (!entry) throw new NotFoundException("Library entry not found.");
        if (entry.currentRevision !== expectedRevision)
          throw new ConflictException("This Library entry changed.");
        if (Boolean(entry.archivedAt) === archived) return present(entry);
        const updated = await transaction.libraryEntry.updateMany({
          where: {
            id,
            ownerId,
            currentRevision: expectedRevision,
            archivedAt: entry.archivedAt,
          },
          data: { archivedAt: archived ? new Date() : null },
        });
        if (!updated.count) await this.rejectChange(transaction, ownerId, id);
        return present(
          await transaction.libraryEntry.findUniqueOrThrow({
            where: { id, ownerId },
            include: latestRevision,
          }),
        );
      })
      .catch((error: unknown) => {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          throw new ConflictException(
            "Remove the active master entry before restoring this one.",
          );
        }
        throw error;
      });
  }

  delete(ownerId: string, id: string, expectedRevision: number) {
    return this.database.$transaction(async (transaction) => {
      await transaction.$queryRaw`SELECT id FROM library_entries WHERE id = ${id}::uuid AND owner_id = ${ownerId}::uuid FOR UPDATE`;
      const entry = await transaction.libraryEntry.findUnique({
        where: { id, ownerId },
      });
      if (!entry) throw new NotFoundException("Library entry not found.");
      if (!entry.archivedAt || entry.currentRevision !== expectedRevision)
        throw new ConflictException(
          "Only an unchanged archived entry can be deleted.",
        );
      await transaction.libraryEntry.delete({ where: { id, ownerId } });
      return { deleted: true };
    });
  }

  private async rejectChange(
    transaction: Prisma.TransactionClient,
    ownerId: string,
    id: string,
  ): Promise<never> {
    const entry = await transaction.libraryEntry.findUnique({
      where: { id, ownerId },
      select: { id: true },
    });
    if (!entry) throw new NotFoundException("Library entry not found.");
    throw new ConflictException(
      "This Library entry changed. Reload it and try again.",
    );
  }
}
