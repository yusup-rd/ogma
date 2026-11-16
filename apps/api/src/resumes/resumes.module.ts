import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { DocumentPrototypeModule } from "../document-prototype/document-prototype.module";
import { ResumesController } from "./resumes.controller";
import { ResumesService } from "./resumes.service";
import { ResumeCheckpointsService } from "./resume-checkpoints.service";

@Module({
  imports: [DatabaseModule, DocumentPrototypeModule],
  controllers: [ResumesController],
  providers: [ResumesService, ResumeCheckpointsService],
})
export class ResumesModule {}
