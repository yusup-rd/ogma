import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "./database/database.module";
import { DocumentPrototypeModule } from "./document-prototype/document-prototype.module";
import { HealthController } from "./health.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: ".env.local", isGlobal: true }),
    DatabaseModule,
    DocumentPrototypeModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
