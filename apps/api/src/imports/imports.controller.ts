import { Body, Controller, Post } from "@nestjs/common";
import { ImportExtractionService } from "./import-extraction.service";
import { proposeImportedResume } from "./propose-imported-resume";

@Controller("imports")
export class ImportsController {
  constructor(private readonly extraction: ImportExtractionService) {}

  @Post("extract")
  async extract(@Body() body: unknown) {
    const result = await this.extraction.extract(body);
    return { ...result, ...proposeImportedResume(result.text, result.links) };
  }
}
