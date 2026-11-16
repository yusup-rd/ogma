import {
  BadRequestException,
  Controller,
  Get,
  Header,
  Query,
  StreamableFile,
} from "@nestjs/common";
import { DocumentPrototypeService } from "./document-prototype.service";
import { renderSampleHtml } from "./render-sample-html";

function includeHighlights(value: unknown) {
  if (value === undefined || value === "visible") return true;
  if (value === "hidden") return false;
  throw new BadRequestException("Highlights must be visible or hidden.");
}

@Controller("document-prototype")
export class DocumentPrototypeController {
  constructor(private readonly documents: DocumentPrototypeService) {}

  @Get("preview")
  @Header("Content-Type", "text/html; charset=utf-8")
  @Header(
    "Content-Security-Policy",
    "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'self'",
  )
  preview(@Query("highlights") highlights?: unknown) {
    return renderSampleHtml(includeHighlights(highlights));
  }

  @Get("resume.pdf")
  async pdf(@Query("highlights") highlights?: unknown) {
    const file = await this.documents.exportPdf(includeHighlights(highlights));
    return new StreamableFile(file, {
      type: "application/pdf",
      disposition: 'attachment; filename="alex-morgan-sample.pdf"',
    });
  }

  @Get("resume.docx")
  async docx(@Query("highlights") highlights?: unknown) {
    const file = await this.documents.exportDocx(includeHighlights(highlights));
    return new StreamableFile(file, {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      disposition: 'attachment; filename="alex-morgan-sample.docx"',
    });
  }
}
