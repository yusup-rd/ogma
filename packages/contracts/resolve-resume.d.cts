import type {
  DraftContent,
  ResumeSectionId,
  RichText,
  PageEdge,
} from "./resume-content";
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
export function projectBulletKey(
  entryId: string,
  projectId: string,
  bulletId: string,
): string;
export function bulletKey(entryId: string, bulletId: string): string;
export function defaultStyle(template: TemplateDefaults): WorkspaceStyle;
export function resolveStyle(
  document: ResumeDocument,
  template: TemplateDefaults,
): WorkspaceStyle;
// Measurements are in millimetres.
type TemplateGeometry = Pick<TemplateDefaults, "id" | "photo"> & {
  header: string;
  margins?: WorkspaceStyle["margins"];
};
export function templatePhotoSize(
  style: WorkspaceStyle,
  template: TemplateGeometry,
): number;
export function templateHeaderPadding(
  style: WorkspaceStyle,
  template: TemplateGeometry,
): Record<PageEdge, number>;

export function resolveResume(
  document: ResumeDocument,
  template: TemplateDefaults,
): ResolvedResume;

export function normalizeHiddenKeys(
  document: Pick<ResumeDocument, "content" | "hidden" | "hiddenKeyVersion">,
): string[];
export function visibleBulletIds(
  description: RichText,
  entryId: string,
  hidden: ReadonlySet<string>,
  projectId?: string,
): Set<string>;
