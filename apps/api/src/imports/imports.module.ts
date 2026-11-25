import { Module } from "@nestjs/common";
import { ImportsController } from "./imports.controller";
import { ImportExtractionService } from "./import-extraction.service";

@Module({
  controllers: [ImportsController],
  providers: [ImportExtractionService],
  exports: [ImportExtractionService],
})
export class ImportsModule {}
