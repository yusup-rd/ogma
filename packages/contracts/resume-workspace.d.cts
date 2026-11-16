import type { z } from "zod";
import type {
  DraftContent,
  DesignOptions,
  ResumeSectionId,
} from "./resume-content";

export interface WorkspaceStyle extends DesignOptions {
  font: "sans" | "humanist" | "serif" | "editorial" | "inter";
  accent: string;
  bodySize: number;
  sectionGap: number;
  margin: number;
  lineHeight: number;
  showPhoto: boolean;
}

export interface ResumeDocument {
  schemaVersion: 1;
  layoutId: string;
  sectionOrder?: ("personal" | ResumeSectionId)[];
  content: DraftContent;
  settings: Record<string, WorkspaceStyle>;
  hidden: string[];
  photo?: string;
}

export interface ResumeSummary {
  id: string;
  title: string;
  draftRevision: number;
  updatedAt: string;
  templateName: string;
  paper: "A4" | "Letter";
  archived: boolean;
  pageCount: number | null;
}

export interface SavedResume extends ResumeSummary {
  document: ResumeDocument;
}

export interface ResumeCheckpoint {
  id: string;
  name: string;
  draftRevision: number;
  createdAt: string;
}

export const resumeStyleSchema: z.ZodType<WorkspaceStyle>;
export const resumeFontSchema: z.ZodType<WorkspaceStyle["font"]>;
export const resumeDocumentSchema: z.ZodType<ResumeDocument>;
export const resumeSummarySchema: z.ZodType<ResumeSummary>;
export const savedResumeSchema: z.ZodType<SavedResume>;
export const titleSchema: z.ZodString;
export const checkpointSchema: z.ZodType<ResumeCheckpoint>;
