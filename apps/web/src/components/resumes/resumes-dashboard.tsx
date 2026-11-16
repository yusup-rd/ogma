"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import {
  LuArchive,
  LuChevronRight,
  LuCopy,
  LuFileText,
  LuPlus,
  LuTrash2,
} from "react-icons/lu";
import {
  resumeSummarySchema,
  savedResumeSchema,
  type ResumeSummary,
} from "@ogma/contracts/resume-workspace";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { SignOutDialog } from "@/components/owner-auth/sign-out-dialog";
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
  resumeListSchema,
  ResumeRequestError,
} from "@/lib/resumes/resume-api";

interface ResumesDashboardProps {
  initialRows: ResumeSummary[];
  loadFailed: boolean;
}

const primary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60";
const secondary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line bg-paper px-3 text-sm font-semibold hover:bg-canvas disabled:opacity-60";

const ResumesDashboard = ({
  initialRows,
  loadFailed,
}: ResumesDashboardProps) => {
  const [rows, setRows] = useState(initialRows);
  const [archived, setArchived] = useState(false);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(
    loadFailed ? "Couldn’t load your resumes." : "",
  );
  const [clock, setClock] = useState<{ now?: number; timeZone: string }>({
    timeZone: "UTC",
  });
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
      const result = await requestResume(
        showArchived ? "?archived=true" : "",
        resumeListSchema,
      );
      setRows(result);
      setArchived(showArchived);
      setSearch("");
      setError("");
    } catch {
      setError("Couldn’t load your resumes. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const openDraft = async (sourceId?: string) => {
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
      window.location.assign(
        new URL(`/resumes/${resume.id}`, window.location.origin),
      );
    } catch {
      setError(
        sourceId
          ? "Couldn’t duplicate the resume. Try again."
          : "Couldn’t create a resume. Try again.",
      );
      setBusy(false);
    }
  };

  const archive = async (row: ResumeSummary) => {
    try {
      await requestResume(`/${row.id}/archive`, resumeSummarySchema, {
        method: "POST",
        body: { archived: !row.archived },
      });
      setRows((current) => current.filter(({ id }) => id !== row.id));
    } catch {
      throw new Error("Couldn’t update this resume. Try again.");
    }
  };

  const deleteResume = async (row: ResumeSummary) => {
    try {
      await deleteArchivedResume(row.id, row.draftRevision);
      setRows((current) => current.filter(({ id }) => id !== row.id));
    } catch (error) {
      if (error instanceof ResumeRequestError && error.status === 409)
        throw new Error(
          "This resume changed. Close this dialog and reload the archive.",
        );
      throw new Error("Couldn’t delete this resume. Try again.");
    }
  };

  return (
    <div className="min-h-dvh bg-canvas text-ink md:grid md:grid-cols-[13.5rem_minmax(0,1fr)]">
      <aside className="flex items-center justify-between gap-3 border-b border-line bg-paper px-4 py-3 md:sticky md:top-0 md:h-dvh md:flex-col md:items-stretch md:justify-start md:border-r md:border-b-0 md:px-5 md:py-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-lg font-semibold"
        >
          <Image src="/icon.svg" alt="" width={32} height={32} />
          Ogma
        </Link>
        <nav
          aria-label="Workspace"
          className="hidden border-t border-line pt-5 md:mt-2 md:block"
        >
          <Link
            aria-current="page"
            href="/"
            className="flex min-h-10 items-center gap-3 rounded-lg bg-accent-soft px-3 text-sm font-semibold text-accent"
          >
            <LuFileText aria-hidden="true" className="size-4" />
            Resumes
          </Link>
        </nav>
        <div className="md:mt-auto md:border-t md:border-line md:pt-3">
          <SignOutDialog sidebar />
        </div>
      </aside>
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-7 px-4 py-7 md:gap-8 md:px-10 md:py-10">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight">Resumes</h1>
            <p className="mt-2 text-sm text-muted">
              Create, tailor, and manage your resume versions.
            </p>
          </div>
          <button
            type="button"
            className={primary}
            disabled={busy}
            onClick={() => void openDraft()}
          >
            <LuPlus aria-hidden="true" className="size-4" />
            New resume
          </button>
        </header>
        {error && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-paper p-3">
            <p role="alert" className="text-sm text-red-800">
              {error}
            </p>
            <button
              type="button"
              className={secondary}
              disabled={busy}
              onClick={() => void showRows(archived)}
            >
              Reload list
            </button>
          </div>
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
                <a href={`/resumes/${latest.id}`} className={primary}>
                  <LuChevronRight aria-hidden="true" className="size-4" />
                  Continue editing
                </a>
                <button
                  type="button"
                  disabled={busy}
                  className={secondary}
                  onClick={() => void openDraft(latest.id)}
                >
                  Duplicate
                </button>
              </div>
            </div>
            <div
              aria-hidden="true"
              className="hidden h-54 w-1/3 shrink-0 justify-items-center overflow-hidden rounded-lg bg-accent-soft pt-7 lg:grid"
            >
              <iframe
                title="Saved resume thumbnail"
                src={`/api/resumes/${latest.id}/thumbnail?revision=${latest.draftRevision}`}
                loading="lazy"
                sandbox=""
                referrerPolicy="no-referrer"
                tabIndex={-1}
                className={`pointer-events-none w-54 max-w-[78%] rounded-t-sm border-0 bg-paper shadow-lg ${latest.paper === "Letter" ? "aspect-[8.5/11]" : "aspect-[210/297]"}`}
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
              <button
                type="button"
                disabled={busy}
                className={secondary}
                onClick={() => void showRows(!archived)}
              >
                {archived ? "Active resumes" : "Archive"}
              </button>
            </div>
          </div>
          {filtered.length ? (
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
                        <a
                          href={`/resumes/${row.id}`}
                          className="block text-sm font-semibold break-words hover:text-accent hover:underline"
                        >
                          {row.title}
                        </a>
                      )}
                      <p className="mt-1 text-xs text-muted">
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
                      title={formatDateTime(row.updatedAt, clock.timeZone)}
                      className="font-medium text-ink"
                    >
                      {formatLastEdited(
                        row.updatedAt,
                        clock.now,
                        clock.timeZone,
                      )}
                    </time>
                  </div>
                  <div className="col-start-2 row-span-2 row-start-1 flex gap-2 md:col-start-3 md:row-span-1">
                    {!row.archived && (
                      <button
                        type="button"
                        disabled={busy}
                        title="Duplicate resume"
                        aria-label={`Duplicate ${row.title}`}
                        className={secondary}
                        onClick={() => void openDraft(row.id)}
                      >
                        <LuCopy aria-hidden="true" className="size-4" />
                      </button>
                    )}
                    <ConfirmationDialog
                      trigger={
                        <button
                          type="button"
                          disabled={busy}
                          className={secondary}
                          title={
                            row.archived ? "Restore resume" : "Archive resume"
                          }
                          aria-label={`${row.archived ? "Restore" : "Archive"} ${row.title}`}
                        >
                          <LuArchive aria-hidden="true" className="size-4" />
                        </button>
                      }
                      title={
                        row.archived ? "Restore resume?" : "Archive resume?"
                      }
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
                          <button
                            type="button"
                            disabled={busy}
                            className={`${secondary} text-red-800 hover:bg-red-50`}
                            aria-label={`Delete ${row.title}`}
                          >
                            <LuTrash2 aria-hidden="true" className="size-4" />
                            Delete
                          </button>
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
      </main>
    </div>
  );
};

export { ResumesDashboard };
