import { Injectable, type OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma-client/client";

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleDestroy {
  constructor(config: ConfigService) {
    const connectionString = config.getOrThrow<string>("DATABASE_URL");
    const adapter = new PrismaPg({
      connectionString,
      connectionTimeoutMillis: 3000,
    });

    super({ adapter });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
