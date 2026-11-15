import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useId, useState, type ReactNode } from "react";
import { LuCheck, LuChevronRight, LuGripVertical } from "react-icons/lu";
import {
  sectionKey,
  sectionTitles,
  type EditorSectionId,
} from "@/lib/document-prototype/content-presentation";

export interface VisibilityProps {
  hidden: ReadonlySet<string>;
  onToggle: (key: string) => void;
}

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
    <span className="relative inline-grid shrink-0 place-items-center">
      <input
        type="checkbox"
        aria-label={label}
        checked={checked}
        onChange={onChange}
        className="peer size-4.5 cursor-pointer appearance-none rounded-[5px] border border-line bg-paper checked:border-accent checked:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent forced-colors:appearance-auto"
      />
      <LuCheck
        aria-hidden="true"
        className="pointer-events-none absolute hidden size-3.5 stroke-3 text-white peer-checked:block forced-colors:hidden!"
      />
    </span>
  );
};

interface SectionCardProps<Value> extends VisibilityProps {
  section: EditorSectionId;
  value: Value;
  onSave: (value: Value) => void;
  subtitle?: string;
  children: (value: Value, update: (value: Value) => void) => ReactNode;
}

const SectionCard = <Value,>({
  section,
  value,
  onSave,
  subtitle,
  hidden,
  onToggle,
  children,
}: SectionCardProps<Value>) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Value>();
  const [revision, setRevision] = useState(0);
  const bodyId = useId();
  const title = sectionTitles[section];
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
            <span className="text-sm font-semibold">{title}</span>
            {subtitle && <span className="text-xs text-muted">{subtitle}</span>}
          </span>
          <LuChevronRight
            aria-hidden="true"
            className={`size-4 shrink-0 text-muted ${open ? "rotate-90" : ""}`}
          />
        </button>
      </div>
      <div id={bodyId} hidden={!open}>
        {open && (
          <div className="flex flex-col gap-4 border-t border-line p-3">
            <div key={revision} className="flex flex-col gap-3">
              {children(draft ?? value, setDraft)}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {draft !== undefined && (
                <span role="status" className="mr-auto text-xs text-muted">
                  Unsaved changes
                </span>
              )}
              <button
                type="button"
                disabled={draft === undefined}
                onClick={() => {
                  setDraft(undefined);
                  setRevision((n) => n + 1);
                }}
                className="min-h-10 rounded-lg border border-line px-3 text-sm font-semibold enabled:hover:bg-canvas disabled:opacity-45"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={draft === undefined}
                onClick={() => {
                  if (draft !== undefined) onSave(draft);
                  setDraft(undefined);
                }}
                className="min-h-10 rounded-lg bg-accent px-3 text-sm font-semibold text-white enabled:hover:bg-accent-hover disabled:opacity-45"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export { SectionCard, VisibilityCheckbox };
