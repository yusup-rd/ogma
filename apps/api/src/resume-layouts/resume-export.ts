import { StreamableFile } from "@nestjs/common";
import type { DocumentPrototypeService } from "../document-prototype/document-prototype.service";
import type { ResumeLayout } from "./layout-catalog";
import type { LayoutDraft } from "./layout-draft";
import { paginateResume } from "./paginate-resume";
import { renderResumeLayout } from "./render-resume-layout";
import { renderResumeWord } from "./render-resume-word";

export async function exportResume(
  documents: DocumentPrototypeService,
  draft: LayoutDraft,
  layout: ResumeLayout,
  format: "pdf" | "docx",
) {
  const file =
    format === "pdf"
      ? await documents.printPdf(
          renderResumeLayout(draft, layout),
          paginateResume,
        )
      : await renderResumeWord(draft, layout);
  return new StreamableFile(file, {
    type:
      format === "pdf"
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    disposition: `attachment; filename="resume.${format}"`,
  });
}
