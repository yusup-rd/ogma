import {
  createContext,
  useContext,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";
import { createStore } from "zustand/vanilla";
import { useStore } from "zustand";
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

type EditorControlsStore = ReturnType<typeof createEditorControlsStore>;

const createEditorControlsStore = (controls: EditorControls) =>
  createStore<EditorControls>()(() => controls);

const EditorControlsContext = createContext<EditorControlsStore | null>(null);

interface EditorControlsProviderProps extends EditorControls {
  children: ReactNode;
}

const EditorControlsProvider = ({
  children,
  ...controls
}: EditorControlsProviderProps) => {
  const [store] = useState(() => createEditorControlsStore(controls));
  const {
    locked,
    hidden,
    onToggle,
    titles,
    onDraftChange,
    onPreviewChange,
    onRename,
  } = controls;

  useLayoutEffect(() => {
    store.setState({
      locked,
      hidden,
      onToggle,
      titles,
      onDraftChange,
      onPreviewChange,
      onRename,
    });
  }, [
    locked,
    hidden,
    onToggle,
    titles,
    onDraftChange,
    onPreviewChange,
    onRename,
    store,
  ]);

  return (
    <EditorControlsContext.Provider value={store}>
      {children}
    </EditorControlsContext.Provider>
  );
};

const useEditorControls = <Value,>(
  selector: (state: EditorControls) => Value,
) => {
  const store = useContext(EditorControlsContext);
  if (!store)
    throw new Error("Editor controls must be used within the editor.");
  return useStore(store, selector);
};

export { EditorControlsProvider, useEditorControls };
