import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { DocumentPrototypeModule } from "../document-prototype/document-prototype.module";
import { ResumesController } from "./resumes.controller";
import { ResumesService } from "./resumes.service";
import { ResumeCheckpointsService } from "./resume-checkpoints.service";
import { ResumeAnalysisService } from "./resume-analysis.service";
import { ImportsModule } from "../imports/imports.module";
import { ResumeImportService } from "./resume-import.service";

@Module({
  imports: [DatabaseModule, DocumentPrototypeModule, ImportsModule],
  controllers: [ResumesController],
  providers: [
    ResumesService,
    ResumeCheckpointsService,
    ResumeAnalysisService,
    ResumeImportService,
  ],
})
export class ResumesModule {}
