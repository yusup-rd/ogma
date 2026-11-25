import { Injectable } from "@nestjs/common";
import { createHash, randomUUID } from "node:crypto";
import {
  analysisResultSchema,
  type AnalysisResult,
} from "@ogma/contracts/resume-analysis";
import { DatabaseService } from "../database/database.service";
import { DocumentPrototypeService } from "../document-prototype/document-prototype.service";
import { ImportExtractionService } from "../imports/import-extraction.service";
import { paginateResume } from "../resume-layouts/paginate-resume";
import { renderResumeLayout } from "../resume-layouts/render-resume-layout";
import { renderResumeWord } from "../resume-layouts/render-resume-word";
import { contactHref } from "../resume-layouts/resume-links";
import { ResumesService } from "./resumes.service";

const normalized = (text: string) =>
  text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");

@Injectable()
export class ResumeAnalysisService {
  constructor(
    private readonly resumes: ResumesService,
    private readonly documents: DocumentPrototypeService,
    private readonly extraction: ImportExtractionService,
    private readonly database: DatabaseService,
  ) {}

  async latest(ownerId: string, resumeId: string, format: "pdf" | "docx") {
    await this.resumes.get(ownerId, resumeId);
    const run = await this.database.analysisRun.findFirst({
      where: { resumeId, format },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
    return run ? analysisResultSchema.parse(run.result) : null;
  }

  async run(
    ownerId: string,
    resumeId: string,
    expectedRevision: number,
    format: "pdf" | "docx",
  ) {
    const { draft, layout, revision } = await this.resumes.getRenderSnapshot(
      ownerId,
      resumeId,
      expectedRevision,
    );
    const result: AnalysisResult = {
      id: randomUUID(),
      draftRevision: revision,
      fingerprint: createHash("sha256")
        .update(JSON.stringify(draft))
        .digest("hex"),
      format,
      rubricVersion: 1,
      createdAt: new Date().toISOString(),
      status: "complete",
      score: null,
      checks: [],
    };
    const add = (
      id: string,
      category: string,
      label: string,
      points: number,
      passed: boolean | null,
      fix: string,
      field?: string,
    ) => {
      result.checks.push({
        id,
        category,
        label,
        points,
        earned: passed ? points : 0,
        status: passed === null ? "skipped" : passed ? "passed" : "failed",
        severity: points >= 10 ? "error" : "warning",
        fix,
        ...(field ? { field } : {}),
      });
    };
    const content = draft.content;
    add(
      "name",
      "Structure",
      "Name is present",
      10,
      Boolean(
        content.contact.firstName.trim() || content.contact.lastName.trim(),
      ),
      "Add your name in Personal details.",
      "personal",
    );
    add(
      "contact",
      "Structure",
      "A contact method is present",
      10,
      Boolean(content.contact.email.trim() || content.contact.phone.trim()),
      "Add an email address or telephone number.",
      "personal",
    );
    add(
      "content",
      "Structure",
      "Relevant content is included",
      5,
      Boolean(
        content.summary.trim() ||
        content.experience.length ||
        content.education.length ||
        content.projects.length ||
        content.skills.length,
      ),
      "Include experience, education, skills, projects, or a summary.",
      "content",
    );
    const typedLinks = (["linkedin", "github"] as const).filter((key) =>
      content.contact[key].trim(),
    );
    add(
      "link-fields",
      "Consistency",
      "Social links match their field",
      5,
      typedLinks.length
        ? typedLinks.every((key) => {
            const href = contactHref(key, content.contact[key]);
            if (!href) return false;
            const host = new URL(href).hostname.toLowerCase();
            return host === key + ".com" || host.endsWith("." + key + ".com");
          })
        : null,
      "Move each social URL to its matching field. Put your portfolio in Website.",
      "personal",
    );
    const dated = [
      ...content.experience,
      ...content.education,
      ...content.projects,
      ...content.certifications,
    ];
    add(
      "date-order",
      "Consistency",
      "Date ranges run forward",
      5,
      dated.some((entry) => entry.startDate && entry.endDate)
        ? dated.every(
            (entry) =>
              !entry.startDate ||
              !entry.endDate ||
              entry.startDate.slice(
                0,
                Math.min(entry.startDate.length, entry.endDate.length),
              ) <=
                entry.endDate.slice(
                  0,
                  Math.min(entry.startDate.length, entry.endDate.length),
                ),
          )
        : null,
      "Correct any end date earlier than its start date.",
      "content",
    );
    try {
      const html = renderResumeLayout(draft, layout);
      const inspection = await this.documents.inspectResume(
        html,
        paginateResume,
      );
      const bytes =
        format === "pdf"
          ? await this.documents.printPdf(html, paginateResume)
          : await renderResumeWord(draft, layout);
      const extracted = await this.extraction.extract({
        format,
        base64: bytes.toString("base64"),
      });
      const actual = normalized(extracted.text);
      const words = inspection.text
        .split(/\s+/)
        .map(normalized)
        .filter((word) => word.length >= 3);
      const coverage = words.length
        ? words.filter((word) => actual.includes(word)).length / words.length
        : 0;
      add(
        "text-extraction",
        "Extraction",
        "Expected text survives export",
        25,
        Boolean(actual) && coverage >= 0.98,
        "Review missing or garbled text in the export. Try a simpler template or a bundled font.",
      );
      const headings = [
        ...new Set(inspection.headings.map(normalized).filter(Boolean)),
      ];
      const positions = headings.map((heading) => actual.indexOf(heading));
      add(
        "reading-order",
        "Extraction",
        "Section reading order is preserved",
        10,
        headings.length > 1
          ? positions.every(
              (position, index) =>
                position >= 0 &&
                (index === 0 || position > positions[index - 1]),
            )
          : null,
        "Review the export’s section order. Try a single-column template for linear reading.",
      );
      add(
        "link-labels",
        "Extraction",
        "Contact link labels survive export",
        5,
        inspection.links.length
          ? inspection.links.every(
              (link) =>
                actual.includes(normalized(link.label)) &&
                extracted.links.some(
                  (exported) =>
                    exported.url.replace(/\/$/, "") ===
                    link.url.replace(/\/$/, ""),
                ),
            )
          : null,
        "Check both the displayed labels and hyperlink destinations in the export.",
        "personal",
      );
      add(
        "overflow",
        "Legibility",
        "Text fits within page bounds",
        8,
        format === "pdf" ? !inspection.overflow : null,
        "Reduce text size or spacing, increase available width, or add a section page break.",
        "design",
      );
      add(
        "text-size",
        "Legibility",
        "Text is at least 8 points",
        8,
        format === "pdf" ? !inspection.smallText : null,
        "Increase body and section font sizes to at least 8 points.",
        "design",
      );
      add(
        "heading-placement",
        "Legibility",
        "Headings stay with their content",
        4,
        format === "pdf" ? !inspection.detachedHeadings : null,
        "Move a section to the next page or reduce its spacing to keep its heading with the first entry.",
        "design",
      );
      add(
        "headings",
        "Consistency",
        "Section headings are readable",
        5,
        headings.length
          ? headings.every((heading) => actual.includes(heading))
          : null,
        "Use descriptive section names and confirm they appear in the export.",
        "content",
      );
      if (format === "docx")
        result.checks.push({
          id: "word-pagination",
          category: "Export",
          label: "Word layout needs visual review",
          status: "advisory",
          points: 0,
          earned: 0,
          severity: "info",
          fix: "Open the editable Word file to check pagination with your installed fonts. Multi-column designs use a single-column Word export.",
        });
      if (draft.photo || layout.rail !== "none")
        result.checks.push({
          id: "visual-layout",
          category: "Export",
          label: "Photo or column layout is included",
          status: "advisory",
          points: 0,
          earned: 0,
          severity: "info",
          fix: "Review contact visibility and reading order in the downloaded file.",
        });
      if (!actual) result.status = "incomplete";
    } catch {
      result.status = "incomplete";
      result.checks.push({
        id: "artifact-unavailable",
        category: "Export",
        label: "Export inspection could not complete",
        status: "failed",
        points: 0,
        earned: 0,
        severity: "error",
        fix: "Retry when the renderer is available. Check the export manually if the document exceeds import inspection limits.",
      });
    }
    const applicable = result.checks.filter((check) =>
      ["passed", "failed"].includes(check.status),
    );
    const total = applicable.reduce((sum, check) => sum + check.points, 0);
    result.score =
      result.status === "complete" && total
        ? Math.round(
            (applicable.reduce((sum, check) => sum + check.earned, 0) / total) *
              100,
          )
        : null;
    await this.database.analysisRun.create({
      data: {
        id: result.id,
        resumeId,
        draftRevision: revision,
        fingerprint: result.fingerprint,
        format,
        rubricVersion: 1,
        result: JSON.parse(JSON.stringify(result)),
      },
    });
    return analysisResultSchema.parse(result);
  }
}
