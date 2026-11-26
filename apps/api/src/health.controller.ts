import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { DatabaseService } from "./database/database.service";
import { PublicRoute } from "./owner-auth/owner-auth.guard";

@Controller("health")
export class HealthController {
  constructor(private readonly database: DatabaseService) {}

  @Get()
  @PublicRoute(true)
  getHealth() {
    return { status: "ok" };
  }

  @Get("ready")
  @PublicRoute(true)
  async getReadiness() {
    try {
      await this.database.$transaction(async (transaction) => {
        await transaction.$executeRaw`SET LOCAL statement_timeout = '2s'`;
        await transaction.libraryEntry.findFirst({ select: { id: true } });
        await transaction.libraryEntryRevision.findFirst({
          select: { revision: true },
        });
        await transaction.resume.findFirst({ select: { id: true } });
        await transaction.ownerSession.findFirst({
          select: { tokenHash: true },
        });
        await transaction.signInAttempt.findFirst({
          select: { tokenHash: true },
        });
        await transaction.resumeCheckpoint.findFirst({ select: { id: true } });
        await transaction.resumeCheckpointRestore.findFirst({
          select: { id: true },
        });
        await transaction.analysisRun.findFirst({ select: { id: true } });
      });
      return { status: "ok", database: "ok" };
    } catch {
      throw new ServiceUnavailableException({
        status: "unavailable",
        database: "unavailable",
      });
    }
  }
}
