import type { PhotoCrop } from "./resume-content-schema.cjs";
import type { z } from "zod";
import type { LibraryEntryContent } from "./content-library.cjs";
import type {
  DraftContent,
  DesignOptions,
  ResumeSectionId,
} from "./resume-content";

export interface SectionStyle {
  title?: string;
  headingSize?: number;
  headingWeight?: 200 | 300 | 400 | 600 | 700;
  letterSpacing?: number;
  bulletSpacing?: number;
  sectionGap?: number;
  lineHeight?: number;
  breakBefore?: boolean;
}

export interface WorkspaceStyle extends DesignOptions {
  sectionOverrides?: Partial<Record<ResumeSectionId, SectionStyle>>;
  font: "sans" | "humanist" | "serif" | "editorial" | "inter" | "poppins";
  accent: string;
  bodySize: number;
  sectionGap: number;
  margin: number;
  lineHeight: number;
  showPhoto: boolean;
}

export interface ResumeLibrarySource {
  entryId: string;
  libraryId: string;
  revision: number;
  content: LibraryEntryContent;
}

export interface ResumeDocument {
  schemaVersion: 1;
  layoutId: string;
  sectionOrder?: ("personal" | ResumeSectionId)[];
  content: DraftContent;
  experienceSources?: ResumeLibrarySource[];
  librarySources?: ResumeLibrarySource[];
  settings: Record<string, WorkspaceStyle>;
  hidden: string[];
  /** Older documents are converted by the shared parser without changing saved checkpoints. */
  hiddenKeyVersion?: 2;
  photo?: string;
  photoCrop?: PhotoCrop;
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
