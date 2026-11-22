"use client";
import { notifyAfterNavigation } from "@/lib/notifications/navigation";

import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  libraryListQuery,
  cacheLibraryEntry,
  removeCachedLibraryEntry,
} from "@/lib/queries/library-queries";
import { cacheResumeSummary } from "@/lib/queries/resume-queries";
import { queryKeys } from "@/lib/queries/query-keys";
import { toast } from "sonner";

import { useCallback, useMemo, useRef, useState } from "react";
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
  saveLibraryEntry,
} from "@/lib/content-library/library-api";
import {
  libraryTitle,
  librarySubtitle,
  type LibraryValue,
} from "@/lib/content-library/library-content";
import { createResume } from "@/lib/resumes/resume-api";
import { LibraryEntryForm } from "./library-entry-form";

interface ContentLibraryProps {
  loadFailed: boolean;
  continueToResume: boolean;
}

type EditState = { id?: string; entry?: LibraryEntry };

const emptyEntries: LibraryEntry[] = [];

const kinds = Object.keys(librarySections) as LibraryKind[];
const primary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60";
const secondary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line bg-paper px-3 text-sm font-semibold hover:bg-canvas disabled:opacity-60";

const ContentLibrary = ({
  loadFailed,
  continueToResume,
}: ContentLibraryProps) => {
  const client = useQueryClient();
  const router = useRouter();
  const [section, setSection] = useState<LibraryKind>("personal");
  const [archived, setArchived] = useState(false);
  const list = useQuery({
    ...libraryListQuery(archived),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const entries = list.data ?? emptyEntries;
  const [editor, setEditor] = useState<EditState>();
  const [editorReset, setEditorReset] = useState(0);
  const [draftEditors, setDraftEditors] = useState(
    () => new Map<string, EditState>(),
  );
  const [loadBlocked, setBlocked] = useState(loadFailed);
  const blocked = !list.data && (loadBlocked || list.isError || list.isPending);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionError, setError] = useState("");
  const error =
    actionError ||
    (!list.data && loadFailed ? "Couldn’t load your Library." : "");
  const [drafts, setDrafts] = useState(() => new Map<string, LibraryValue>());
  const createIds = useRef(new Map<string, string>());
  const resumeId = useRef<string | undefined>(undefined);
  const rows = useMemo(
    () => entries.filter((entry) => entry.content.kind === section),
    [entries, section],
  );
  const singleton = singletonLibraryKinds.includes(section);
  const activeEditor = useMemo(() => {
    if (archived || blocked) return undefined;
    const candidate =
      editor ??
      (singleton || !rows.length
        ? { id: rows[0]?.id, entry: rows[0] }
        : undefined);
    if (!candidate) return undefined;
    const recovery = draftEditors.get(
      `${section}:${candidate.entry?.id ?? "new"}`,
    );
    const singletonRecovery =
      !editor && singleton
        ? [...draftEditors].find(([key]) => key.startsWith(`${section}:`))?.[1]
        : undefined;
    return recovery ?? singletonRecovery ?? candidate;
  }, [archived, blocked, editor, singleton, rows, draftEditors, section]);
  const draftKey =
    section +
    ":" +
    (activeEditor?.entry
      ? activeEditor.entry.id + ":" + activeEditor.entry.revision
      : "new");
  const rememberDraft = useCallback(
    (draft: LibraryValue | undefined) => {
      if (activeEditor)
        setDraftEditors((current) => {
          const key = `${section}:${activeEditor.entry?.id ?? "new"}`;
          if (draft ? current.get(key) === activeEditor : !current.has(key))
            return current;
          const next = new Map(current);
          if (draft) next.set(key, activeEditor);
          else next.delete(key);
          return next;
        });
      setDrafts((current) => {
        if (current.get(draftKey) === draft) return current;
        const next = new Map(current);
        if (draft) next.set(draftKey, draft);
        else next.delete(draftKey);
        return next;
      });
    },
    [draftKey, activeEditor, section],
  );
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
      if (showArchived === archived)
        await client.invalidateQueries({
          queryKey: queryKeys.libraryList(showArchived),
          refetchType: "none",
        });
      await client.fetchQuery(libraryListQuery(showArchived));
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
      await cacheResumeSummary(client, resume);
      router.push(`/resumes/${resume.id}`);
    } catch {
      toast.error("Couldn’t create a resume. Try again.");
      setBusy(false);
    }
  };

  const discardAndReloadSection = async () => {
    setBusy(true);
    try {
      const queryKey = queryKeys.libraryList(false);
      await client.cancelQueries({ queryKey });
      await client.invalidateQueries({ queryKey, refetchType: "none" });
      const fresh = await client.fetchQuery(libraryListQuery(false));
      const prefix = `${section}:`;
      setDraftEditors(
        (current) =>
          new Map([...current].filter(([key]) => !key.startsWith(prefix))),
      );
      setDrafts(
        (current) =>
          new Map([...current].filter(([key]) => !key.startsWith(prefix))),
      );
      for (const key of createIds.current.keys()) {
        if (key.startsWith(prefix)) createIds.current.delete(key);
      }
      const entry = fresh.find(({ content }) => content.kind === section);
      setEditor(entry ? { id: entry.id, entry } : undefined);
      setEditorReset((current) => current + 1);
      setBlocked(false);
      setError("");
      toast.success("Loaded the saved section.");
    } catch {
      throw new Error(
        "Couldn’t reload this section. Your unsaved edits are still here. Try again.",
      );
    } finally {
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
      {(error || list.isError) && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-paper p-3">
          <p role="alert" className="text-sm text-red-800">
            {error || "Couldn’t refresh your Library. Try again."}
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
                          const updated = await archiveLibraryEntry(entry);
                          await cacheLibraryEntry(client, updated);
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
                            await removeCachedLibraryEntry(client, entry.id);
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
                (activeEditor.entry?.revision ?? 0) +
                ":" +
                editorReset
              }
              locked={busy}
              cachedDraft={drafts.get(draftKey)}
              onDraftChange={rememberDraft}
              getCreateId={() => {
                const cached = createIds.current.get(draftKey);
                if (cached) return cached;
                const id = activeEditor.id ?? crypto.randomUUID();
                createIds.current.set(draftKey, id);
                return id;
              }}
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
                  ? () => {
                      rememberDraft(undefined);
                      createIds.current.delete(draftKey);
                      setEditor(undefined);
                    }
                  : undefined
              }
              actions={
                singleton ? (
                  <>
                    {drafts.has(draftKey) && (
                      <ConfirmationDialog
                        trigger={
                          <button
                            type="button"
                            disabled={locked}
                            className={secondary}
                          >
                            Discard and reload
                          </button>
                        }
                        title={`Reload ${sectionTitle.toLowerCase()}?`}
                        description="Discard unsaved changes in this section and load its latest saved entry. Drafts in other sections are kept."
                        confirmLabel="Discard and reload"
                        action={discardAndReloadSection}
                      />
                    )}
                    {activeEditor.entry && (
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
                            const updated = await archiveLibraryEntry(entry);
                            rememberDraft(undefined);
                            createIds.current.delete(draftKey);
                            await cacheLibraryEntry(client, updated);
                            setEditor(undefined);
                            toast.success("Entry moved to the archive.");
                          } catch {
                            throw new Error(
                              "Couldn’t archive this entry. Reload the Library and try again.",
                            );
                          }
                        }}
                      />
                    )}
                  </>
                ) : undefined
              }
              onSave={async (id, content) => {
                if (busy)
                  throw new Error("Wait for the Library to finish loading.");
                setSaving(true);
                try {
                  const entry = await saveLibraryEntry(
                    id,
                    content,
                    activeEditor.entry?.revision,
                  );
                  rememberDraft(undefined);
                  createIds.current.delete(draftKey);
                  await cacheLibraryEntry(client, entry);
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
