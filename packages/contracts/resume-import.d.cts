import type { z } from "zod";
import type { ResumeDocument } from "./resume-workspace.cjs";
export interface ImportReview {
  text: string;
  pageCount: number | null;
  warnings: string[];
  requiresManualEntry: boolean;
  links: { url: string; label: string; page: number }[];
  document: ResumeDocument;
  unmapped: string;
}
export const importReviewSchema: z.ZodType<ImportReview>;
