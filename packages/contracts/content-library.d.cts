import type { PhotoCrop } from "./resume-content-schema.cjs";
import type { z } from "zod";
import type { RichText, Skill, WorkProject } from "./resume-content";

export type LibraryKind =
  | "personal"
  | "experience"
  | "education"
  | "projects"
  | "skills"
  | "certifications"
  | "languages"
  | "links"
  | "summary"
  | "awards"
  | "volunteering"
  | "publications";

export interface LibraryBullet {
  id: string;
  text: string;
}

export interface LibraryEntryContent {
  kind: LibraryKind;
  fields: Record<string, string>;
  details?: string;
  summary?: string;
  description?: RichText;
  photo?: string;
  photoCrop?: PhotoCrop;
  logo?: string;
  projects?: WorkProject[];
  skills?: Skill[];
  current?: boolean;
  bullets?: LibraryBullet[];
}

export interface LibraryEntry {
  id: string;
  revision: number;
  archived: boolean;
  updatedAt: string;
  content: LibraryEntryContent;
}

interface EntryChange {
  expectedRevision: number;
  content: LibraryEntryContent;
}

export const singletonLibraryKinds: readonly LibraryKind[];
export const librarySections: Record<
  LibraryKind,
  { label: string; fields: Readonly<Record<string, string>> }
>;
export const libraryEntrySchema: z.ZodType<LibraryEntry>;
export const libraryEntryContentSchema: z.ZodType<LibraryEntryContent>;
export const libraryListSchema: z.ZodType<LibraryEntry[]>;
export const createLibraryEntrySchema: z.ZodType<{
  id: string;
  content: LibraryEntryContent;
}>;
export const updateLibraryEntrySchema: z.ZodType<EntryChange>;
export const archiveLibraryEntrySchema: z.ZodType<{
  expectedRevision: number;
  archived: boolean;
}>;
export const libraryStatusSchema: z.ZodType<{ hasEntries: boolean }>;

export const deleteLibraryEntrySchema: z.ZodType<{ expectedRevision: number }>;
