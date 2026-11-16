import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "./database/database.module";
import { DocumentPrototypeModule } from "./document-prototype/document-prototype.module";
import { HealthController } from "./health.controller";
import { ResumeLayoutsModule } from "./resume-layouts/resume-layouts.module";

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: ".env.local", isGlobal: true }),
    DatabaseModule,
    DocumentPrototypeModule,
    ResumeLayoutsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
