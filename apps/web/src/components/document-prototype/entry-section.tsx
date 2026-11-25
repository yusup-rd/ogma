import type { ReactNode } from "react";
import { useId, useState } from "react";
import { LuChevronRight, LuPlus } from "react-icons/lu";
import type { RichText } from "../../../../../packages/contracts/resume-content";
import {
  descriptionBullets,
  entryKey,
  type EditorSectionId,
} from "@/lib/document-prototype/content-presentation";
import { SectionCard, VisibilityCheckbox } from "./section-card";
import { useEditorControls } from "@/stores/editor-controls-store";

interface EntrySectionProps<
  Entry extends { id: string; description?: RichText },
> {
  section: Exclude<EditorSectionId, "personal" | "summary">;
  singular: string;
  entries: Entry[];
  makeEntry: () => Entry;
  update: (entries: Entry[]) => void;
  label: (entry: Entry) => string;
  children: (
    entry: Entry,
    patch: (changes: Partial<Entry>) => void,
  ) => ReactNode;
}

const EntrySection = <Entry extends { id: string; description?: RichText }>({
  section,
  singular,
  entries,
  makeEntry,
  update,
  label,
  children,
}: EntrySectionProps<Entry>) => {
  const hidden = useEditorControls((state) => state.hidden);
  const onToggle = useEditorControls((state) => state.onToggle);
  const [expanded, setExpanded] = useState<string[]>([]);
  const id = useId();
  const count = entries.filter(
    (entry) => !hidden.has(entryKey(entry.id)),
  ).length;

  return (
    <SectionCard
      section={section}
      previewValue={(value) => ({ content: { [section]: value } })}
      value={entries}
      onSave={update}
      subtitle={`${count} of ${entries.length} entries included`}
    >
      {(draft, setDraft, updateCurrent) => (
        <>
          {draft.map((entry, index) => {
            const open = expanded.includes(entry.id);
            const title =
              label(entry).trim() ||
              `New ${singular}${draft.length > 1 ? " " + (index + 1) : ""}`;
            const detailId = id + "-" + index;
            const bullets = entry.description
              ? descriptionBullets(entry.description, entry.id)
              : [];
            return (
              <div key={entry.id} className="rounded-lg border border-line">
                <div className="flex items-center gap-2 pl-3">
                  <VisibilityCheckbox
                    label={`Include ${title}`}
                    checked={!hidden.has(entryKey(entry.id))}
                    onChange={() => onToggle(entryKey(entry.id))}
                  />
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={detailId}
                    onClick={() =>
                      setExpanded((current) =>
                        open
                          ? current.filter((value) => value !== entry.id)
                          : [...current, entry.id],
                      )
                    }
                    className="my-0.5 mr-0.5 flex min-h-10 min-w-0 flex-1 items-center justify-between gap-2 rounded-md px-2 pr-3 text-left text-sm font-medium hover:bg-canvas"
                  >
                    <span>{title}</span>
                    <LuChevronRight
                      aria-hidden="true"
                      className={`size-4 shrink-0 text-muted ${open ? "rotate-90" : ""}`}
                    />
                  </button>
                </div>
                {bullets.length > 0 && !open && (
                  <ul className="flex flex-col gap-1.5 px-3 pt-1 pb-3 pl-8">
                    {bullets.map((bullet) => (
                      <li key={bullet.key}>
                        <label className="flex min-h-7 items-start gap-2 text-xs leading-relaxed text-muted">
                          <VisibilityCheckbox
                            label={`Include bullet: ${bullet.label}`}
                            checked={!hidden.has(bullet.key)}
                            onChange={() => onToggle(bullet.key)}
                          />
                          <span className="wrap-anywhere">{bullet.label}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
                <div id={detailId} hidden={!open}>
                  {open && (
                    <div className="flex flex-col gap-3 border-t border-line p-3">
                      {children(entry, (changes) =>
                        updateCurrent((current) =>
                          current.map((item) =>
                            item.id === entry.id
                              ? { ...item, ...changes }
                              : item,
                          ),
                        ),
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setExpanded((current) =>
                            current.filter((value) => value !== entry.id),
                          );
                          setDraft(
                            draft.filter((item) => item.id !== entry.id),
                          );
                        }}
                        className="min-h-10 self-start rounded-md px-2 text-xs font-semibold text-red-800 hover:bg-red-50"
                      >
                        Remove {singular}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <button
            type="button"
            disabled={draft.length >= 50}
            onClick={() => {
              const entry = makeEntry();
              setExpanded((current) => [...current, entry.id]);
              setDraft([...draft, entry]);
            }}
            className="flex min-h-10 items-center gap-1.5 self-start rounded-md border border-line px-3 text-xs font-semibold hover:bg-canvas disabled:opacity-50"
          >
            <LuPlus aria-hidden="true" className="size-4" />
            Add {singular}
          </button>
        </>
      )}
    </SectionCard>
  );
};

export { EntrySection };
