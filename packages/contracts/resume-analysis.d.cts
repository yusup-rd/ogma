import type { z } from "zod";
export interface AnalysisCheck {
  id: string;
  category: string;
  label: string;
  status: "passed" | "failed" | "skipped" | "advisory";
  points: number;
  earned: number;
  field?: string;
  fix: string;
  severity: "error" | "warning" | "info";
}
export interface AnalysisResult {
  id: string;
  draftRevision: number;
  fingerprint: string;
  format: "pdf" | "docx";
  rubricVersion: 1;
  createdAt: string;
  status: "complete" | "incomplete";
  score: number | null;
  checks: AnalysisCheck[];
}
export const analysisResultSchema: z.ZodType<AnalysisResult>;
