import { createStore } from "zustand/vanilla";
import type { ResumeDocument } from "@ogma/contracts/resume-workspace";
import type { SectionPreview } from "@/lib/document-prototype/content-preview";
import type { EditorSectionId } from "@/lib/document-prototype/content-presentation";

export interface EditorControls {
  locked?: boolean;
  hidden: ReadonlySet<string>;
  onToggle: (key: string) => void;
  titles: ResumeDocument["sectionTitles"];
  onDraftChange: (section: EditorSectionId, hasDraft: boolean) => void;
  onPreviewChange: (section: EditorSectionId, preview?: SectionPreview) => void;
  onRename: (
    section: Exclude<EditorSectionId, "personal">,
    title: string,
  ) => void;
}

export const createEditorControlsStore = (controls: EditorControls) =>
  createStore<EditorControls>()(() => controls);
