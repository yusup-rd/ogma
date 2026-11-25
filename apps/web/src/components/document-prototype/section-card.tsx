import { toast } from "sonner";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { LuChevronRight, LuGripVertical } from "react-icons/lu";
import type { SectionPreview } from "@/lib/document-prototype/content-preview";
import { SectionTitleEditor } from "./section-title-editor";
import { useEditorControls } from "./editor-controls-store";
import {
  sectionKey,
  sectionTitles,
  type EditorSectionId,
} from "@/lib/document-prototype/content-presentation";

interface VisibilityCheckboxProps {
  label: string;
  checked: boolean;
  onChange: () => void;
}

const VisibilityCheckbox = ({
  label,
  checked,
  onChange,
}: VisibilityCheckboxProps) => {
  return (
    <input
      type="checkbox"
      aria-label={label}
      checked={checked}
      onChange={onChange}
      className="size-4.5 shrink-0"
    />
  );
};

interface SectionCardProps<Value> {
  section: EditorSectionId;
  value: Value;
  onSave: (value: Value) => void;
  previewValue: (value: Value) => SectionPreview;
  subtitle?: string;
  initialOpen?: boolean;
  children: (
    value: Value,
    update: (value: Value) => void,
    updateCurrent: (resolve: (value: Value) => Value) => void,
  ) => ReactNode;
}

const SectionCard = <Value,>({
  section,
  value,
  onSave,
  subtitle,
  initialOpen = false,
  previewValue,
  children,
}: SectionCardProps<Value>) => {
  const locked = useEditorControls((state) => state.locked ?? false);
  const hidden = useEditorControls((state) => state.hidden);
  const onToggle = useEditorControls((state) => state.onToggle);
  const titles = useEditorControls((state) => state.titles);
  const onDraftChange = useEditorControls((state) => state.onDraftChange);
  const onPreviewChange = useEditorControls((state) => state.onPreviewChange);
  const onRename = useEditorControls((state) => state.onRename);
  const [open, setOpen] = useState(initialOpen);
  const [{ draft, revision, resetCount }, setDraftState] = useState<{
    draft?: Value;
    revision: number;
    resetCount: number;
  }>({ revision: 0, resetCount: 0 });
  const hasDraft = draft !== undefined;
  const previewMapper = useRef(previewValue);
  useLayoutEffect(() => {
    previewMapper.current = previewValue;
  }, [previewValue]);
  useLayoutEffect(() => {
    onPreviewChange(
      section,
      draft === undefined ? undefined : previewMapper.current(draft),
    );
  }, [draft, onPreviewChange, section]);
  useLayoutEffect(
    () => () => onPreviewChange(section, undefined),
    [onPreviewChange, section],
  );
  useLayoutEffect(() => {
    if (!hasDraft) return;
    onDraftChange(section, true);
    return () => onDraftChange(section, false);
  }, [hasDraft, onDraftChange, section]);
  const updateDraft = (resolve: (current: Value) => Value) => {
    setDraftState((current) =>
      current.revision === revision
        ? { ...current, draft: resolve(current.draft ?? value) }
        : current,
    );
  };
  const clearDraft = (resetForm = false) =>
    setDraftState((current) => ({
      revision: current.revision + 1,
      resetCount: current.resetCount + Number(resetForm),
    }));
  const bodyId = useId();
  const title =
    (section !== "personal" && titles?.[section]) || sectionTitles[section];
  const sortable = section !== "personal" && section !== "summary";
  const {
    setNodeRef,
    setActivatorNodeRef,
    attributes,
    listeners,
    transform,
    isDragging,
  } = useSortable({ id: section, transition: null, disabled: !sortable });

  return (
    <section
      ref={setNodeRef}
      aria-label={title}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={`relative rounded-xl border border-line bg-paper ${isDragging ? "z-20 shadow-lg" : ""}`}
    >
      <div
        className={`flex min-h-14 items-center gap-2 ${sortable ? "pl-2" : "pl-4"}`}
      >
        {sortable && (
          <button
            ref={setActivatorNodeRef}
            type="button"
            {...attributes}
            {...listeners}
            aria-label={`Reorder ${title}`}
            className="grid min-h-10 w-7 shrink-0 cursor-grab touch-none place-items-center rounded-md text-muted hover:bg-canvas active:cursor-grabbing active:bg-accent-soft"
          >
            <LuGripVertical aria-hidden="true" className="size-4" />
          </button>
        )}
        <VisibilityCheckbox
          label={`Include ${title}`}
          checked={!hidden.has(sectionKey(section))}
          onChange={() => onToggle(sectionKey(section))}
        />
        <button
          type="button"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => setOpen(!open)}
          className="mr-1 flex min-h-12 min-w-0 flex-1 items-center justify-between gap-2 rounded-lg px-2 pr-2 text-left hover:bg-canvas"
        >
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="text-sm font-semibold wrap-anywhere">{title}</span>
            {subtitle && <span className="text-xs text-muted">{subtitle}</span>}
            {hasDraft && (
              <span className="text-xs text-accent">Unsaved changes</span>
            )}
          </span>
          <LuChevronRight
            aria-hidden="true"
            className={`size-4 shrink-0 text-muted ${open ? "rotate-90" : ""}`}
          />
        </button>
        {section !== "personal" && (
          <SectionTitleEditor
            section={section}
            title={title}
            onRename={onRename}
          />
        )}
      </div>
      <div id={bodyId} hidden={!open}>
        {open && (
          <div className="flex flex-col gap-4 border-t border-line p-3">
            <div key={resetCount} className="flex flex-col gap-3">
              {children(
                draft ?? value,
                (next) => updateDraft(() => next),
                updateDraft,
              )}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                disabled={draft === undefined}
                onClick={() => clearDraft(true)}
                className="min-h-10 rounded-lg border border-line px-3 text-sm font-semibold enabled:hover:bg-canvas disabled:opacity-45"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={draft === undefined}
                onClick={() => {
                  if (draft !== undefined) {
                    onSave(draft);
                    toast.success(
                      title + (locked ? " applied to preview." : " updated."),
                      {
                        id: "section-updated",
                      },
                    );
                  }
                  clearDraft();
                }}
                className="min-h-10 rounded-lg bg-accent px-3 text-sm font-semibold text-white enabled:hover:bg-accent-hover disabled:opacity-45"
              >
                {locked ? "Apply to preview" : "Save"}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export { SectionCard, VisibilityCheckbox };
