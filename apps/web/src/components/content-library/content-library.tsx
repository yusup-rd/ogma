"use client";
import { notifyAfterNavigation } from "@/lib/notifications/navigation";

import { toast } from "sonner";

import { useRef, useState } from "react";
import {
  LuArchive,
  LuBriefcaseBusiness,
  LuChevronRight,
  LuLibrary,
  LuPlus,
  LuTrash2,
} from "react-icons/lu";
import {
  librarySections,
  singletonLibraryKinds,
  type LibraryEntry,
  type LibraryKind,
} from "@ogma/contracts/content-library";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { WorkspaceShell } from "@/components/workspace-shell";
import {
  archiveLibraryEntry,
  deleteLibraryEntry,
  LibraryRequestError,
  loadLibrary,
  saveLibraryEntry,
} from "@/lib/content-library/library-api";
import {
  libraryTitle,
  librarySubtitle,
} from "@/lib/content-library/library-content";
import { createResume } from "@/lib/resumes/resume-api";
import { LibraryEntryForm } from "./library-entry-form";

interface ContentLibraryProps {
  initialEntries: LibraryEntry[];
  loadFailed: boolean;
  continueToResume: boolean;
}

type EditState = { id: string; entry?: LibraryEntry };

const kinds = Object.keys(librarySections) as LibraryKind[];
const primary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60";
const secondary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line bg-paper px-3 text-sm font-semibold hover:bg-canvas disabled:opacity-60";

const ContentLibrary = ({
  initialEntries,
  loadFailed,
  continueToResume,
}: ContentLibraryProps) => {
  const [entries, setEntries] = useState(initialEntries);
  const [section, setSection] = useState<LibraryKind>("personal");
  const [archived, setArchived] = useState(false);
  const [editor, setEditor] = useState<EditState>();
  const [blocked, setBlocked] = useState(loadFailed);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(
    loadFailed ? "Couldn’t load your Library." : "",
  );
  const resumeId = useRef<string | undefined>(undefined);
  const rows = entries.filter((entry) => entry.content.kind === section);
  const singleton = singletonLibraryKinds.includes(section);
  const activeEditor =
    !archived && !blocked
      ? (editor ??
        (singleton || !rows.length
          ? { id: rows[0]?.id, entry: rows[0] }
          : undefined))
      : undefined;
  const sectionTitle = librarySections[section].label;
  const locked = busy || saving;

  const selectSection = (kind: LibraryKind) => {
    setSection(kind);
    setEditor(undefined);
  };

  const openLibrary = async (showArchived: boolean) => {
    setBusy(true);
    setError("");
    try {
      setEntries(await loadLibrary(showArchived));
      setArchived(showArchived);
      setBlocked(false);
      setEditor(undefined);
    } catch {
      setError("Couldn’t load your Library. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const startResume = async () => {
    setBusy(true);
    setError("");
    resumeId.current ??= crypto.randomUUID();
    try {
      const resume = await createResume({
        id: resumeId.current,
        title: "Untitled resume",
      });
      notifyAfterNavigation("Resume created.");
      window.location.assign(
        new URL("/resumes/" + resume.id, window.location.origin),
      );
    } catch {
      toast.error("Couldn’t create a resume. Try again.");
      setBusy(false);
    }
  };

  return (
    <WorkspaceShell active="library">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">
            Content library
          </h1>
          <p className="mt-2 text-sm text-muted">
            Store reusable details for your resumes.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {continueToResume && !archived && entries.length > 0 && (
            <button
              type="button"
              className={secondary}
              disabled={locked}
              onClick={() => void startResume()}
            >
              Continue to new resume
            </button>
          )}
          {!archived && !singleton && rows.length > 0 && (
            <button
              type="button"
              className={primary}
              disabled={locked || blocked || Boolean(editor && !editor.entry)}
              onClick={() => setEditor({ id: crypto.randomUUID() })}
            >
              <LuPlus aria-hidden="true" className="size-4" />
              Add another
            </button>
          )}
        </div>
      </header>
      {error && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-paper p-3">
          <p role="alert" className="text-sm text-red-800">
            {error}
          </p>
          <button
            type="button"
            className={secondary}
            disabled={locked}
            onClick={() => void openLibrary(archived)}
          >
            Reload Library
          </button>
        </div>
      )}
      <div className="grid items-start gap-5 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <nav
          aria-label="Library sections"
          className="rounded-2xl border border-line bg-paper p-2"
        >
          <p className="px-2 pt-2 pb-3 text-xs font-semibold text-muted">
            Sections
          </p>
          <ul className="flex flex-wrap gap-1 lg:flex-col">
            {kinds.map((kind) => (
              <li key={kind}>
                <button
                  type="button"
                  aria-pressed={kind === section}
                  disabled={locked}
                  className="min-h-10 w-full rounded-lg px-3 text-left text-sm font-semibold hover:bg-canvas aria-pressed:bg-accent-soft aria-pressed:text-accent"
                  onClick={() => selectSection(kind)}
                >
                  {librarySections[kind].label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <section
          aria-labelledby="library-section-heading"
          className="min-w-0 rounded-2xl border border-line bg-paper p-4 sm:p-6"
        >
          <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2
                id="library-section-heading"
                className="text-2xl font-semibold tracking-tight"
              >
                {archived ? sectionTitle + " archive" : sectionTitle}
              </h2>
              {!blocked && (archived || (!singleton && rows.length > 0)) && (
                <p className="mt-2 text-sm text-muted">
                  {rows.length} {archived ? "archived " : ""}
                  {rows.length === 1 ? "entry" : "entries"}
                </p>
              )}
            </div>
            <button
              type="button"
              className={secondary}
              disabled={locked}
              onClick={() => void openLibrary(!archived)}
            >
              <LuArchive aria-hidden="true" className="size-4" />
              {archived ? "Back to Library" : "View archive"}
            </button>
          </header>
          {rows.length > 0 && (archived || !singleton) && (
            <ul className="flex flex-col gap-2.5">
              {rows.map((entry) => {
                const title = libraryTitle(entry.content);
                const subtitle = librarySubtitle(entry.content);
                const Icon =
                  section === "experience" ? LuBriefcaseBusiness : LuLibrary;
                const label = entry.archived ? "Restore" : "Archive";
                return (
                  <li
                    key={entry.id}
                    className="flex min-w-0 items-center gap-2 rounded-xl border border-line p-2"
                  >
                    <button
                      type="button"
                      disabled={locked || archived}
                      aria-expanded={
                        archived ? undefined : editor?.id === entry.id
                      }
                      className="flex min-h-13 min-w-0 flex-1 items-center gap-3 rounded-lg px-1 text-left enabled:hover:bg-canvas"
                      onClick={() => setEditor({ id: entry.id, entry })}
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
                        <Icon aria-hidden="true" className="size-4" />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="text-sm font-semibold wrap-anywhere">
                          {title}
                        </span>
                        {subtitle && (
                          <span className="text-xs wrap-anywhere text-muted">
                            {subtitle}
                          </span>
                        )}
                      </span>
                      {!archived && (
                        <LuChevronRight
                          aria-hidden="true"
                          className="size-4 shrink-0 text-muted"
                        />
                      )}
                    </button>
                    <ConfirmationDialog
                      trigger={
                        <button
                          type="button"
                          disabled={locked}
                          aria-label={label + " entry " + title}
                          title={label + " entry"}
                          className={secondary}
                        >
                          <LuArchive aria-hidden="true" className="size-4" />
                          {archived ? "Restore" : "Archive entry"}
                        </button>
                      }
                      title={
                        archived ? "Restore this entry?" : "Archive this entry?"
                      }
                      description={
                        archived
                          ? "Move this entry back into your active Library."
                          : "Hide this entry from your active Library. You can restore it from the archive."
                      }
                      confirmLabel={label}
                      action={async () => {
                        try {
                          await archiveLibraryEntry(entry);
                          setEntries((current) =>
                            current.filter(({ id }) => id !== entry.id),
                          );
                          if (editor?.id === entry.id) setEditor(undefined);
                          toast.success(
                            archived
                              ? "Entry restored."
                              : "Entry moved to the archive.",
                          );
                        } catch (error) {
                          throw new Error(
                            error instanceof LibraryRequestError &&
                              error.status === 409
                              ? "This entry changed, or this master section already has an active entry. Archive the active entry before restoring another."
                              : "Couldn’t update this entry. Try again.",
                          );
                        }
                      }}
                    />
                    {archived && (
                      <ConfirmationDialog
                        trigger={
                          <button
                            type="button"
                            disabled={locked}
                            className={secondary}
                            aria-label={"Delete entry " + title}
                          >
                            <LuTrash2 aria-hidden="true" className="size-4" />
                            Delete
                          </button>
                        }
                        title="Delete this entry permanently?"
                        description="This removes the archived entry and its Library history. Resumes and checkpoints keep their saved content."
                        confirmLabel="Delete entry"
                        destructive
                        action={async () => {
                          try {
                            await deleteLibraryEntry(entry);
                            setEntries((current) =>
                              current.filter(({ id }) => id !== entry.id),
                            );
                            toast.success("Entry deleted.");
                          } catch {
                            throw new Error(
                              "Couldn’t delete this entry. Reload the archive and try again.",
                            );
                          }
                        }}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {!rows.length && !activeEditor && !blocked && (
            <p className="rounded-xl border border-dashed border-line px-4 py-8 text-sm text-muted">
              {archived
                ? "No archived entries in this section."
                : "No entries in this section yet."}
            </p>
          )}
          {activeEditor && (
            <LibraryEntryForm
              key={
                section +
                ":" +
                (activeEditor.id ?? "new") +
                ":" +
                (activeEditor.entry?.revision ?? 0)
              }
              entryId={activeEditor.id}
              initial={activeEditor.entry?.content}
              kind={section}
              title={
                !singleton && rows.length
                  ? activeEditor.entry
                    ? libraryTitle(activeEditor.entry.content)
                    : "New entry"
                  : undefined
              }
              onCancel={
                !singleton && rows.length > 0
                  ? () => setEditor(undefined)
                  : undefined
              }
              actions={
                singleton && activeEditor.entry ? (
                  <ConfirmationDialog
                    trigger={
                      <button
                        type="button"
                        disabled={locked}
                        className={secondary}
                      >
                        <LuArchive aria-hidden="true" className="size-4" />
                        Archive this entry
                      </button>
                    }
                    title="Archive this entry?"
                    description="Move the saved entry to the archive and start with a blank form. Unsaved edits will be discarded. You can restore the saved entry later."
                    confirmLabel="Archive entry"
                    action={async () => {
                      const entry = activeEditor.entry;
                      if (!entry) return;
                      try {
                        await archiveLibraryEntry(entry);
                        setEntries((current) =>
                          current.filter(({ id }) => id !== entry.id),
                        );
                        setEditor(undefined);
                        toast.success("Entry moved to the archive.");
                      } catch {
                        throw new Error(
                          "Couldn’t archive this entry. Reload the Library and try again.",
                        );
                      }
                    }}
                  />
                ) : undefined
              }
              onSave={async (id, content) => {
                setSaving(true);
                try {
                  const entry = await saveLibraryEntry(
                    id,
                    content,
                    activeEditor.entry?.revision,
                  );
                  setEntries((current) =>
                    entry.archived
                      ? current.filter(({ id }) => id !== entry.id)
                      : [entry, ...current.filter(({ id }) => id !== entry.id)],
                  );
                  setEditor(
                    entry.archived ? undefined : { id: entry.id, entry },
                  );
                  toast.success("Saved to Library.", { id: "library-saved" });
                } finally {
                  setSaving(false);
                }
              }}
            />
          )}
        </section>
      </div>
    </WorkspaceShell>
  );
};

export { ContentLibrary };
