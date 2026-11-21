import type { z } from "zod";
import type { DraftContent, ProjectEntry } from "./resume-content";

export interface PhotoCrop {
  source: string;
  x: number;
  y: number;
  zoom: number;
}
export const photoCrop: z.ZodType<PhotoCrop>;
export const field: z.ZodString;
export const picture: z.ZodString;
export const draftContentSchema: z.ZodType<
  Omit<DraftContent, "projects"> & {
    projects: (ProjectEntry & { workEntryId?: string })[];
  }
>;
