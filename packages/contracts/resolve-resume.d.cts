import type { DraftContent, ResumeSectionId } from "./resume-content";
import type { ResumeDocument, WorkspaceStyle } from "./resume-workspace.cjs";

type TemplateDefaults = Pick<
  WorkspaceStyle,
  "font" | "accent" | "bodySize" | "sectionGap" | "margin" | "lineHeight"
> & {
  id: string;
  photo: string;
};

export interface ResolvedResume {
  layoutId: string;
  sectionOrder?: ResumeSectionId[];
  content: DraftContent;
  style: WorkspaceStyle;
  photo?: string;
}

export function sectionKey(id: "personal" | ResumeSectionId): string;
export function entryKey(id: string): string;
export function bulletKey(entryId: string, bulletId: string): string;
export function defaultStyle(template: TemplateDefaults): WorkspaceStyle;
export function resolveResume(
  document: ResumeDocument,
  template: TemplateDefaults,
): ResolvedResume;
