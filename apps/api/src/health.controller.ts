import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { DatabaseService } from "./database/database.service";

@Controller("health")
export class HealthController {
  constructor(private readonly database: DatabaseService) {}

  @Get()
  getHealth() {
    return { status: "ok" };
  }

  @Get("ready")
  async getReadiness() {
    try {
      await this.database.$transaction(async (transaction) => {
        await transaction.$executeRaw`SET LOCAL statement_timeout = '2s'`;
        await transaction.resume.findFirst({ select: { id: true } });
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
