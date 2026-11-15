import { Controller, Get, Header, Query, StreamableFile } from "@nestjs/common";
import { DocumentPrototypeService } from "./document-prototype.service";
import { renderSampleHtml } from "./render-sample-html";

@Controller("document-prototype")
export class DocumentPrototypeController {
  constructor(private readonly documents: DocumentPrototypeService) {}

  @Get("preview")
  @Header("Content-Type", "text/html; charset=utf-8")
  @Header(
    "Content-Security-Policy",
    "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'self'",
  )
  preview(@Query("highlights") highlights?: string) {
    return renderSampleHtml(highlights !== "hidden");
  }

  @Get("resume.pdf")
  async pdf(@Query("highlights") highlights?: string) {
    const file = await this.documents.exportPdf(highlights !== "hidden");
    return new StreamableFile(file, {
      type: "application/pdf",
      disposition: 'attachment; filename="alex-morgan-sample.pdf"',
    });
  }

  @Get("resume.docx")
  async docx(@Query("highlights") highlights?: string) {
    const file = await this.documents.exportDocx(highlights !== "hidden");
    return new StreamableFile(file, {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      disposition: 'attachment; filename="alex-morgan-sample.docx"',
    });
  }
}
