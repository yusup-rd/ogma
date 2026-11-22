import type { ResumeDocument } from "@ogma/contracts/resume-workspace";
import type { DraftContent } from "./resume-layout-model";

export interface SectionPreview {
  content: Partial<DraftContent>;
  photo?: ResumeDocument["photo"];
  photoCrop?: ResumeDocument["photoCrop"];
}
