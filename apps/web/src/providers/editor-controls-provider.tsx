import {
  createContext,
  useContext,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";
import { useStore } from "zustand";
import {
  createEditorControlsStore,
  type EditorControls,
} from "@/stores/editor-controls-store";

type EditorControlsStore = ReturnType<typeof createEditorControlsStore>;

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
