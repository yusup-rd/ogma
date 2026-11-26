"use client";
import { notifyAfterNavigation } from "@/lib/notifications/navigation";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries/query-keys";
import {
  resumeListQuery,
  cacheResumeSummary,
  removeCachedResume,
} from "@/lib/queries/resume-queries";
import { libraryStatusQuery } from "@/lib/queries/library-queries";
import { toast } from "sonner";

import { useEffect, useState, useRef } from "react";
import {
  LuArchive,
  LuChevronRight,
  LuCopy,
  LuFileText,
  LuLockKeyhole,
  LuLockKeyholeOpen,
  LuTrash2,
  LuUpload,
} from "react-icons/lu";
import {
  resumeSummarySchema,
  savedResumeSchema,
  type ResumeSummary,
} from "@ogma/contracts/resume-workspace";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { ActionButton, ActionLink } from "@/components/ui/action-button";
import { RetryNotice } from "@/components/ui/retry-notice";
import { LibraryOnboarding } from "@/components/content-library/library-onboarding";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { SavedResumeThumbnail } from "./saved-resume-thumbnail";
import { useResumePageCounts } from "@/hooks/resumes/use-resume-page-counts";
import {
  formatDateTime,
  formatLastEdited,
  formatResumeDetails,
} from "@/lib/formatUtil";
import {
  createResume,
  deleteArchivedResume,
  requestResume,
  ResumeRequestError,
} from "@/lib/resumes/resume-api";

interface ResumesDashboardProps {
  initialClock: { now: number; timeZone: string } | null;
  loadFailed: boolean;
}

const ResumesDashboard = ({
  initialClock,
  loadFailed,
}: ResumesDashboardProps) => {
  const client = useQueryClient();
  const router = useRouter();
  const [archived, setArchived] = useState(false);
  const list = useQuery(resumeListQuery(archived));
  const rows = list.data ?? [];
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [showLibraryPrompt, setShowLibraryPrompt] = useState(false);
  const [actionError, setError] = useState("");
  const error =
    actionError ||
    (!list.data && loadFailed ? "Couldn’t load your resumes." : "");
  const [clock, setClock] = useState(initialClock);
  const pageCount = useResumePageCounts(rows);
  const mutationIds = useRef(new Map<string, string>());
  const latest = !archived ? rows[0] : undefined;
  const filtered = rows.filter(({ title }) =>
    title.toLowerCase().includes(search.trim().toLowerCase()),
  );
  useEffect(() => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const update = () => setClock({ now: Date.now(), timeZone });
    const initial = window.setTimeout(update, 0);
    const interval = window.setInterval(update, 60_000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
    };
  }, []);

  const showRows = async (showArchived: boolean) => {
    setBusy(true);
    try {
      if (showArchived === archived)
        await client.invalidateQueries({
          queryKey: queryKeys.resumeList(showArchived),
          refetchType: "none",
        });
      await client.fetchQuery(resumeListQuery(showArchived));
      setArchived(showArchived);
      setSearch("");
      setError("");
    } catch {
      setError("Couldn’t load your resumes. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  const openDraft = async (sourceId?: string) => {
    if (!active.current) return;
    const key = sourceId ?? "new";
    const existing = mutationIds.current.get(key);
    const id = existing ?? crypto.randomUUID();
    mutationIds.current.set(key, id);
    setBusy(true);
    setError("");
    try {
      const resume = sourceId
        ? await requestResume(`/${sourceId}/duplicate`, savedResumeSchema, {
            method: "POST",
            body: { id },
          })
        : await createResume({ id, title: "Untitled resume" });
      if (!active.current) return;
      notifyAfterNavigation(
        sourceId ? "Resume duplicated." : "Resume created.",
      );
      await cacheResumeSummary(client, resume);
      router.push(`/resumes/${resume.id}`);
    } catch {
      if (!active.current) return;
      toast.error(
        sourceId
          ? "Couldn’t duplicate the resume. Try again."
          : "Couldn’t create a resume. Try again.",
      );
      setBusy(false);
    }
  };

  const startNewResume = async () => {
    if (busy || !active.current) return;
    setBusy(true);
    setError("");
    try {
      const status = await client.fetchQuery(libraryStatusQuery());
      if (!active.current) return;
      if (status.hasEntries) {
        await openDraft();
        return;
      }
      setShowLibraryPrompt(true);
    } catch {
      if (!active.current) return;
      toast.error("Couldn’t check your Library. Try New resume again.");
    }
    setBusy(false);
  };

  const archive = async (row: ResumeSummary) => {
    try {
      const updated = await requestResume(
        `/${row.id}/archive`,
        resumeSummarySchema,
        {
          method: "POST",
          body: { archived: !row.archived },
        },
      );
      await cacheResumeSummary(client, updated);
      toast.success(row.archived ? "Resume restored." : "Resume archived.");
    } catch {
      throw new Error("Couldn’t update this resume. Try again.");
    }
  };

  const deleteResume = async (row: ResumeSummary) => {
    try {
      await deleteArchivedResume(row.id, row.draftRevision);
      toast.success("Resume deleted.");
      await removeCachedResume(client, row.id);
    } catch (error) {
      if (error instanceof ResumeRequestError && error.status === 409)
        throw new Error(
          "This resume changed. Close this dialog and reload the archive.",
        );
      throw new Error("Couldn’t delete this resume. Try again.");
    }
  };

  const toggleLock = async (row: ResumeSummary) => {
    setBusy(true);
    try {
      const saved = row.locked
        ? await requestResume(`/${row.id}`, savedResumeSchema)
        : undefined;
      if (saved && saved.draftRevision !== row.draftRevision)
        throw new ResumeRequestError(409);
      const updated = await requestResume(
        `/${row.id}/lock`,
        resumeSummarySchema,
        {
          method: "POST",
          body: {
            locked: !row.locked,
            expectedRevision: row.draftRevision,
            ...(saved ? { title: saved.title, document: saved.document } : {}),
          },
        },
      );
      await cacheResumeSummary(client, updated);
      toast.success(updated.locked ? "CV locked." : "CV unlocked.");
    } catch (error) {
      if (
        error instanceof ResumeRequestError &&
        [404, 409].includes(error.status)
      ) {
        setError(
          "This resume changed elsewhere. Reload the list before changing its lock.",
        );
        throw new Error(
          "This resume changed. Close this dialog and reload the list.",
        );
      }
      throw new Error("Couldn’t change the lock. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <WorkspaceShell active="resumes">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">Resumes</h1>
          <p className="mt-2 text-sm text-muted">
            Create, tailor, and manage your resume versions.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ActionLink href="/import">
            <LuUpload aria-hidden="true" className="size-4" />
            Import resume
          </ActionLink>
          <LibraryOnboarding
            open={showLibraryPrompt}
            onOpenChange={setShowLibraryPrompt}
            busy={busy}
            onNewResume={() => void startNewResume()}
            onStartBlank={() => void openDraft()}
          />
        </div>
      </header>
      {(error || list.isError) && (
        <RetryNotice
          message={error || "Couldn’t refresh your resumes. Try again."}
          actionLabel="Reload list"
          disabled={busy}
          onRetry={() => void showRows(archived)}
        />
      )}
      {latest && (
        <section
          aria-labelledby="recent-resume"
          className="flex min-h-42 items-center justify-between gap-6 rounded-2xl border border-line bg-paper p-4 md:min-h-56 md:p-6 lg:py-3 lg:pr-3"
        >
          <div className="min-w-0">
            <p className="inline-flex rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
              Recently edited
            </p>
            <h2
              id="recent-resume"
              className="mt-3 text-xl font-semibold break-words md:text-2xl"
            >
              {latest.title}
            </h2>
            <p className="mt-2 text-sm text-muted">
              {formatResumeDetails(
                latest.paper,
                latest.templateName,
                pageCount(latest),
              )}
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5 md:mt-7">
              {/* Full page navigation lets the editor guard browser Back. */}
              <ActionLink href={`/resumes/${latest.id}`} variant="primary">
                <LuChevronRight aria-hidden="true" className="size-4" />
                Continue editing
              </ActionLink>
              <ActionButton
                variant="secondary"
                type="button"
                disabled={busy}
                onClick={() => void openDraft(latest.id)}
              >
                <LuCopy aria-hidden="true" className="size-4" />
                Duplicate
              </ActionButton>
            </div>
          </div>
          <div
            aria-hidden="true"
            className="hidden h-54 w-1/3 shrink-0 justify-items-center overflow-hidden rounded-lg bg-accent-soft pt-7 lg:grid"
          >
            <SavedResumeThumbnail
              key={`${latest.id}:${latest.draftRevision}`}
              id={latest.id}
              revision={latest.draftRevision}
              paper={latest.paper}
            />
          </div>
        </section>
      )}
      <section aria-labelledby="all-resumes" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2
            id="all-resumes"
            className="text-2xl font-semibold tracking-tight"
          >
            {archived ? "Archived resumes" : "All resumes"}
          </h2>
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1 text-xs font-semibold">
              Search
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.currentTarget.value)}
                placeholder="Find a resume"
                className="min-h-11 rounded-lg border border-line bg-paper px-3 text-sm font-normal md:w-64"
              />
            </label>
            <ActionButton
              variant="secondary"
              type="button"
              disabled={busy}
              onClick={() => void showRows(!archived)}
            >
              {archived ? "Active resumes" : "Archive"}
            </ActionButton>
          </div>
        </div>
        {!list.data ? (
          <p
            role="status"
            className="rounded-2xl border border-line bg-paper p-5 text-sm text-muted"
          >
            {list.isFetching
              ? "Loading resumes…"
              : "Resume list unavailable. Use Reload list to try again."}
          </p>
        ) : filtered.length ? (
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-paper">
            {filtered.map((row) => (
              <li
                key={row.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-3 py-3 md:grid-cols-[minmax(0,1fr)_8rem_auto] md:px-5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
                    <LuFileText aria-hidden="true" className="size-4" />
                  </span>
                  <div className="min-w-0">
                    {row.archived ? (
                      <span className="text-sm font-semibold break-words">
                        {row.title}
                      </span>
                    ) : (
                      <Link
                        href={`/resumes/${row.id}`}
                        className="block text-sm font-semibold break-words hover:text-accent hover:underline"
                      >
                        {row.title}
                      </Link>
                    )}
                    <p className="mt-1 text-xs wrap-anywhere text-muted">
                      {formatResumeDetails(
                        row.paper,
                        row.templateName,
                        pageCount(row),
                      )}
                    </p>
                  </div>
                </div>
                <div className="col-start-1 row-start-2 ml-13 flex items-baseline gap-x-1.5 text-xs text-muted md:col-start-2 md:row-start-1 md:ml-0 md:flex-col md:gap-y-1">
                  <span>Last edited</span>
                  <time
                    dateTime={row.updatedAt}
                    title={
                      clock
                        ? formatDateTime(row.updatedAt, clock.timeZone)
                        : undefined
                    }
                    className="font-medium text-ink"
                  >
                    {clock ? (
                      formatLastEdited(row.updatedAt, clock.now, clock.timeZone)
                    ) : (
                      <span
                        aria-label="Loading last edited time"
                        className="inline-block h-3 w-20 rounded-sm bg-line"
                      />
                    )}
                  </time>
                </div>
                <div className="col-start-2 row-span-2 row-start-1 flex gap-2 md:col-start-3 md:row-span-1">
                  {!row.archived && (
                    <ConfirmationDialog
                      trigger={
                        <ActionButton
                          variant="secondary"
                          type="button"
                          disabled={busy}
                          title={row.locked ? "Unlock resume" : "Lock resume"}
                          aria-label={`${row.locked ? "Unlock" : "Lock"} ${row.title}`}
                          className={`min-w-11 ${row.locked ? "border-accent/25 bg-accent-soft text-accent" : ""}`}
                        >
                          {row.locked ? (
                            <LuLockKeyhole
                              aria-hidden="true"
                              className="size-4"
                            />
                          ) : (
                            <LuLockKeyholeOpen
                              aria-hidden="true"
                              className="size-4"
                            />
                          )}
                        </ActionButton>
                      }
                      title={row.locked ? "Unlock this CV?" : "Lock this CV?"}
                      description={
                        row.locked
                          ? `Enable autosave for “${row.title}”. Its saved content and design will stay as they are.`
                          : `Protect “${row.title}” from accidental changes. You can still try content and design changes in its preview.`
                      }
                      confirmLabel={row.locked ? "Unlock CV" : "Lock CV"}
                      action={() => toggleLock(row)}
                    />
                  )}
                  {!row.archived && (
                    <ActionButton
                      variant="secondary"
                      type="button"
                      disabled={busy}
                      title="Duplicate resume"
                      aria-label={`Duplicate ${row.title}`}
                      onClick={() => void openDraft(row.id)}
                    >
                      <LuCopy aria-hidden="true" className="size-4" />
                    </ActionButton>
                  )}
                  <ConfirmationDialog
                    trigger={
                      <ActionButton
                        variant="secondary"
                        type="button"
                        disabled={busy}
                        title={
                          row.archived ? "Restore resume" : "Archive resume"
                        }
                        aria-label={`${row.archived ? "Restore" : "Archive"} ${row.title}`}
                      >
                        <LuArchive aria-hidden="true" className="size-4" />
                      </ActionButton>
                    }
                    title={row.archived ? "Restore resume?" : "Archive resume?"}
                    description={
                      row.archived
                        ? `Move “${row.title}” back to your active resumes.`
                        : `Move “${row.title}” to your archive. You can restore it later.`
                    }
                    confirmLabel={row.archived ? "Restore" : "Archive"}
                    action={() => archive(row)}
                  />
                  {row.archived && (
                    <ConfirmationDialog
                      trigger={
                        <ActionButton
                          variant="secondary"
                          type="button"
                          disabled={busy}
                          className="text-red-800 hover:bg-red-50"
                          aria-label={`Delete ${row.title}`}
                        >
                          <LuTrash2 aria-hidden="true" className="size-4" />
                          Delete
                        </ActionButton>
                      }
                      title="Delete archived resume?"
                      description={`Permanently delete “${row.title}” and its saved checkpoints. This can’t be undone.`}
                      confirmLabel="Delete permanently"
                      destructive
                      action={() => deleteResume(row)}
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl border border-line bg-paper p-5 text-sm text-muted">
            {search
              ? "No resumes match your search."
              : archived
                ? "Your archive is empty."
                : "Create a resume to start building your first draft."}
          </p>
        )}
      </section>
    </WorkspaceShell>
  );
};

export { ResumesDashboard };
