"use client";

import { toast } from "sonner";

import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { LuLibrary, LuPlus, LuRefreshCw, LuX } from "react-icons/lu";
import {
  librarySections,
  type LibraryEntry,
  type LibraryKind,
} from "@ogma/contracts/content-library";
import {
  resumeDocumentSchema,
  type ResumeDocument,
} from "@ogma/contracts/resume-workspace";
import { SelectSetting } from "@/components/document-prototype/select-setting";
import {
  libraryTitle,
  librarySubtitle,
} from "@/lib/content-library/library-content";
import { loadLibrary } from "@/lib/content-library/library-api";
import {
  canIncludeLibraryEntry,
  includeLibraryEntry,
  librarySources,
  reviewLibraryEntry,
  syncLibraryEntry,
} from "@/lib/content-library/resume-library";

interface ResumeLibraryDialogProps {
  document: ResumeDocument;
  disabled: boolean;
  onChange: (update: (document: ResumeDocument) => ResumeDocument) => void;
}

type Choice = "library" | "resume";

const button =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-line px-3 text-xs font-semibold hover:bg-canvas disabled:opacity-60";
const primary =
  "min-h-11 rounded-lg bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60";

const ResumeLibraryDialog = ({
  document,
  disabled,
  onChange,
}: ResumeLibraryDialogProps) => {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<LibraryEntry[]>([]);
  const [section, setSection] = useState<LibraryKind>("personal");
  const [syncError, setSyncError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<LibraryEntry>();
  const [choices, setChoices] = useState<Record<string, Choice>>({});
  const sources = new Map(
    librarySources(document).map((source) => [source.libraryId, source]),
  );
  const changes = selected && reviewLibraryEntry(document, selected);
  const kinds = (Object.keys(librarySections) as LibraryKind[]).filter((kind) =>
    entries.some(({ content }) => content.kind === kind),
  );
  const rows = entries.filter(({ content }) => content.kind === section);
  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      const entries = await loadLibrary(false);
      setEntries(entries);
      setSection((current) =>
        entries.some(({ content }) => content.kind === current)
          ? current
          : (entries[0]?.content.kind ?? "personal"),
      );
    } catch {
      setError("Couldn’t load your Library. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-4 flex flex-col items-start gap-2">
      <Dialog.Root
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          setSelected(undefined);
          setSyncError("");
          if (next) {
            void refresh();
          }
        }}
      >
        <Dialog.Trigger asChild>
          <button type="button" className={button} disabled={disabled}>
            <LuLibrary aria-hidden="true" className="size-4" />
            Add from Library
          </button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/35" />
          <Dialog.Content className="fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-2xl border border-line bg-paper p-5 text-ink shadow-xl sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Dialog.Title className="text-lg font-semibold tracking-tight">
                  {selected ? "Review Library update" : "Add from Library"}
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-muted">
                  {selected
                    ? "Choose which changes to apply to this resume."
                    : "Add reusable content or review updates to linked entries. Existing details stay in your resume."}
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Close Library"
                  className="grid size-10 shrink-0 place-items-center rounded-lg text-muted hover:bg-canvas"
                >
                  <LuX aria-hidden="true" className="size-4" />
                </button>
              </Dialog.Close>
            </div>
            {loading && (
              <p role="status" className="text-sm text-muted">
                Loading Library…
              </p>
            )}
            {error && (
              <div className="flex flex-wrap items-center gap-2">
                <p role="alert" className="text-sm text-red-800">
                  {error}
                </p>
                <button
                  type="button"
                  className={button}
                  onClick={() => void refresh()}
                >
                  Retry
                </button>
              </div>
            )}
            {!loading &&
              !error &&
              !selected &&
              (entries.length === 0 ? (
                <p className="text-sm text-muted">
                  Add content to the Library to use it in this resume.
                </p>
              ) : (
                <>
                  <SelectSetting
                    label="Library section"
                    value={section}
                    options={kinds.map(
                      (kind) => [kind, librarySections[kind].label] as const,
                    )}
                    onChange={setSection}
                  />
                  <ul className="divide-y divide-line rounded-xl border border-line">
                    {rows.map((entry) => {
                      const source = sources.get(entry.id);
                      const update = source && source.revision < entry.revision;
                      const title = libraryTitle(entry.content);
                      const subtitle = librarySubtitle(entry.content);
                      return (
                        <li
                          key={entry.id}
                          className="flex flex-wrap items-center justify-between gap-2 p-3"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold wrap-anywhere">
                              {title}
                            </p>
                            {subtitle && (
                              <p className="mt-1 text-xs wrap-anywhere text-muted">
                                {subtitle}
                              </p>
                            )}
                          </div>
                          {update ? (
                            <button
                              type="button"
                              className={button}
                              onClick={() => {
                                const plan =
                                  reviewLibraryEntry(document, entry) ?? [];
                                setChoices(
                                  Object.fromEntries(
                                    plan.flatMap(({ id, defaultChoice }) =>
                                      defaultChoice
                                        ? [[id, defaultChoice]]
                                        : [],
                                    ),
                                  ),
                                );
                                setSelected(entry);
                              }}
                            >
                              <LuRefreshCw
                                aria-hidden="true"
                                className="size-4"
                              />
                              Review update
                            </button>
                          ) : source ? (
                            <span className="text-xs font-medium text-muted">
                              Already included
                            </span>
                          ) : (
                            <Dialog.Close asChild>
                              <button
                                type="button"
                                className={button}
                                disabled={
                                  !canIncludeLibraryEntry(document, entry)
                                }
                                aria-label={"Add " + title}
                                onClick={() => {
                                  onChange((current) =>
                                    includeLibraryEntry(current, entry),
                                  );
                                  toast.success("Added to this resume.");
                                }}
                              >
                                <LuPlus aria-hidden="true" className="size-4" />
                                Add
                              </button>
                            </Dialog.Close>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </>
              ))}
            {selected && changes && (
              <form
                className="flex flex-col gap-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  const latest = selected;
                  const next = syncLibraryEntry(document, latest, choices);
                  if (
                    next === document ||
                    !resumeDocumentSchema.safeParse(next).success
                  ) {
                    setSyncError(
                      "Couldn’t apply these choices. The section may be full. Remove an item or keep the resume version of some changes.",
                    );
                    return;
                  }
                  onChange((current) =>
                    current === document
                      ? next
                      : syncLibraryEntry(current, latest, choices),
                  );
                  setSelected(undefined);
                  setOpen(false);
                  toast.success("Library update applied to this resume.");
                }}
              >
                {!changes.length && (
                  <p className="text-sm text-muted">
                    Your resume already reflects these changes.
                  </p>
                )}
                {changes.map(
                  ({ id, label, resume, library, defaultChoice }) => (
                    <fieldset
                      key={id}
                      className="rounded-lg border border-line px-3 pt-2 pb-3"
                    >
                      <legend className="px-1 text-xs font-semibold">
                        {label}
                        {!defaultChoice && " · Choose a version"}
                      </legend>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {(
                          [
                            {
                              value: "resume",
                              label: "Keep resume",
                              text: resume,
                            },
                            {
                              value: "library",
                              label: "Use Library",
                              text: library,
                            },
                          ] as const
                        ).map((option) => (
                          <label
                            key={option.value}
                            className="flex items-start gap-2 rounded-lg border border-line px-3 py-2 text-xs has-checked:border-accent has-checked:bg-accent-soft"
                          >
                            <input
                              required
                              type="radio"
                              className="mt-0.5 size-4 shrink-0 accent-accent"
                              name={id}
                              value={option.value}
                              checked={choices[id] === option.value}
                              onChange={() =>
                                setChoices((current) => ({
                                  ...current,
                                  [id]: option.value,
                                }))
                              }
                            />
                            <span className="min-w-0">
                              <span className="block font-semibold">
                                {option.label}
                              </span>
                              <span className="mt-1 block leading-relaxed wrap-anywhere whitespace-pre-wrap text-muted">
                                {option.text || "Empty"}
                              </span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  ),
                )}
                {syncError && (
                  <p role="alert" className="text-sm text-red-800">
                    {syncError}
                  </p>
                )}
                <div className="mt-1 flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    className={button}
                    onClick={() => {
                      setSelected(undefined);
                      setSyncError("");
                    }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className={primary}
                    disabled={changes.some(({ id }) => !choices[id])}
                  >
                    Apply update
                  </button>
                </div>
              </form>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      {disabled && (
        <p className="text-xs text-muted">
          Save or cancel your section edits to use the Library.
        </p>
      )}
    </div>
  );
};

export { ResumeLibraryDialog };
