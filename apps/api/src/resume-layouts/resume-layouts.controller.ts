import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  Post,
  StreamableFile,
} from "@nestjs/common";
import { DocumentPrototypeService } from "../document-prototype/document-prototype.service";
import { fontChoices, getResumeLayout, resumeLayouts } from "./layout-catalog";
import { layoutDraftSchema } from "./layout-draft";
import { designDefaults } from "./design-options";
import { sampleContent } from "./demo-resume";
import { paginateResume } from "./paginate-resume";
import { renderResumeLayout } from "./render-resume-layout";
import { renderResumeWord } from "./render-resume-word";

function resolveDraft(body: unknown) {
  const parsed = layoutDraftSchema.safeParse(body);
  if (!parsed.success)
    throw new BadRequestException(
      "The resume draft contains invalid or oversized fields.",
    );
  const layout = getResumeLayout(parsed.data.layoutId);
  if (!layout) throw new BadRequestException("Unknown resume template.");
  return { draft: parsed.data, layout };
}

@Controller("resume-layouts")
export class ResumeLayoutsController {
  constructor(private readonly documents: DocumentPrototypeService) {}

  @Get()
  catalog() {
    return {
      layouts: resumeLayouts.map((layout) => ({
        ...layout,
        designDefaults: designDefaults(layout),
      })),
      fonts: Object.entries(fontChoices).map(([value, font]) => ({
        value,
        label: font.label,
      })),
      sample: sampleContent,
    };
  }

  @Post("preview")
  @Header("Content-Type", "text/html; charset=utf-8")
  @Header("Cache-Control", "no-store")
  preview(@Body() body: unknown) {
    const { draft, layout } = resolveDraft(body);
    return this.documents.prepareHtml(
      renderResumeLayout(draft, layout),
      paginateResume,
    );
  }

  @Post("resume.pdf")
  @Header("Cache-Control", "no-store")
  async pdf(@Body() body: unknown) {
    const { draft, layout } = resolveDraft(body);
    return new StreamableFile(
      await this.documents.printPdf(
        renderResumeLayout(draft, layout),
        paginateResume,
      ),
      {
        type: "application/pdf",
        disposition: 'attachment; filename="resume.pdf"',
      },
    );
  }

  @Post("resume.docx")
  @Header("Cache-Control", "no-store")
  async docx(@Body() body: unknown) {
    const { draft, layout } = resolveDraft(body);
    return new StreamableFile(await renderResumeWord(draft, layout), {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      disposition: 'attachment; filename="resume.docx"',
    });
  }
}
