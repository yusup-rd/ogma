import { Module } from "@nestjs/common";
import { DocumentPrototypeModule } from "../document-prototype/document-prototype.module";
import { ResumeLayoutsController } from "./resume-layouts.controller";

@Module({
  imports: [DocumentPrototypeModule],
  controllers: [ResumeLayoutsController],
})
export class ResumeLayoutsModule {}
