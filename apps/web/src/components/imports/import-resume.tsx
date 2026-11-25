"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  importReviewSchema,
  type ImportReview,
} from "@ogma/contracts/resume-import";
import {
  savedResumeSchema,
  type ResumeDocument,
} from "@ogma/contracts/resume-workspace";
import {
  LuArrowLeft,
  LuArrowRight,
  LuUpload,
  LuFileText,
  LuFileCheck2,
  LuLink,
  LuChevronDown,
  LuCircleAlert,
  LuLoaderCircle,
  LuRefreshCw,
} from "react-icons/lu";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { formatPageCount } from "@/lib/formatUtil";
import { WorkspaceShell } from "@/components/workspace-shell";
import { ResumeContentForm } from "@/components/document-prototype/resume-content-form";
import {
  sectionTitles,
  type EditorSectionId,
} from "@/lib/document-prototype/content-presentation";
import { requestResume, ResumeRequestError } from "@/lib/resumes/resume-api";
import { importLibraryEntries } from "@/lib/content-library/import-library-entries";
import { invalidateLibraryQueries } from "@/lib/queries/library-queries";
import { useResumeHistoryGuard } from "@/hooks/resumes/use-resume-history-guard";
import { cacheResumeSummary } from "@/lib/queries/resume-queries";

const ImportResume = () => {
  const router = useRouter();
  const fileInputId = useId();
  const [fileName, setFileName] = useState("");
  const [dragging, setDragging] = useState(false);
  const [showAllSections, setShowAllSections] = useState(false);
  const client = useQueryClient();
  const [review, setReview] = useState<ImportReview>();
  const [document, setDocument] = useState<ResumeDocument>();
  const [title, setTitle] = useState("Imported resume");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [addToLibrary, setAddToLibrary] = useState(false);
  const libraryIds = useRef(new Map<string, string>());
  const [drafts, setDrafts] = useState(new Set<EditorSectionId>());
  const onDraftChange = useCallback(
    (section: EditorSectionId, dirty: boolean) => {
      setDrafts((previous) => {
        if (previous.has(section) === dirty) return previous;
        const next = new Set(previous);
        if (dirty) next.add(section);
        else next.delete(section);
        return next;
      });
    },
    [],
  );
  const onPreviewChange = useCallback(() => {}, []);
  const id = useRef<string | undefined>(undefined);
  const [submission, setSubmission] =
    useState<Parameters<typeof requestResume>[2]>(undefined);
  const completed = useRef(false);
  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => {
      if (review && !completed.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [review]);
  useResumeHistoryGuard(
    () => Boolean(review) && !completed.current,
    (proceed) => {
      if (
        window.confirm(
          "Leave this import review? Unsaved changes will be discarded.",
        )
      )
        proceed();
    },
  );
  const read = async (file: File) => {
    if (busy) return;
    setError("");
    if (file.size > 1024 * 1024 || !/\.(pdf|docx)$/i.test(file.name)) {
      setError("Choose a PDF or DOCX file up to 1 MB.");
      return;
    }
    setBusy(true);
    setFileName(file.name);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      let binary = "";
      for (const byte of bytes) binary += String.fromCharCode(byte);
      const response = await fetch("/api/imports/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format: file.name.toLowerCase().endsWith(".pdf") ? "pdf" : "docx",
          base64: btoa(binary),
        }),
        signal: AbortSignal.timeout(25000),
        cache: "no-store",
      });
      if (!response.ok)
        throw new Error(
          response.status === 401
            ? "Sign in again to import a resume."
            : "Couldn’t read this file. Try an unencrypted file, a smaller file, or enter content manually.",
        );
      const result = importReviewSchema.parse(await response.json());
      setReview(result);
      setDocument(result.document);
      setTitle(file.name.replace(/\.(pdf|docx)$/i, "").slice(0, 120));
      setReviewed(false);
      setShowAllSections(false);
      id.current = crypto.randomUUID();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Couldn’t read this file.",
      );
    } finally {
      setBusy(false);
    }
  };
  const save = async () => {
    if (!document || !reviewed || drafts.size || busy) return;
    setBusy(true);
    setError("");
    try {
      const libraryEntries = addToLibrary
        ? importLibraryEntries(document, libraryIds.current)
        : [];
      const payload = submission ?? {
        method: "POST",
        body: {
          id: (id.current ??= crypto.randomUUID()),
          title: title.trim() || "Imported resume",
          document: libraryEntries.length
            ? {
                ...document,
                librarySources: libraryEntries.map((entry) => ({
                  entryId: entry.entryId,
                  libraryId: entry.id,
                  revision: 1,
                  content: entry.content,
                })),
              }
            : document,
          libraryEntries,
        },
      };
      setSubmission(payload);
      const resume = await requestResume("/import", savedResumeSchema, payload);
      if (addToLibrary) await invalidateLibraryQueries(client);
      await cacheResumeSummary(client, resume);
      completed.current = true;
      router.push(`/resumes/${resume.id}`);
    } catch (cause) {
      if (cause instanceof ResumeRequestError && cause.status < 500)
        setSubmission(undefined);
      setError(
        cause instanceof ResumeRequestError && cause.status === 409
          ? "A Library section already exists. Turn off Add to Library to create the CV, then review Library updates from the editor."
          : "Couldn’t save the import. Your review is still available. Try again.",
      );
      setBusy(false);
    }
  };
  return (
    <div
      onClickCapture={(event) => {
        const link =
          event.target instanceof Element
            ? event.target.closest("a[href]")
            : null;
        if (
          !review ||
          completed.current ||
          !link ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        )
          return;
        if (
          window.confirm(
            "Leave this import review? Unsaved changes will be discarded.",
          )
        )
          completed.current = true;
        else {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
    >
      <WorkspaceShell
        active="resumes"
        beforeSignOut={async () => {
          if (review && !completed.current)
            throw new Error(
              "Create the reviewed resume or choose another file to discard the review before signing out.",
            );
          return 1;
        }}
      >
        <div className="flex min-w-0 flex-col gap-7">
          <div>
            {review ? (
              <ConfirmationDialog
                trigger={
                  <button
                    type="button"
                    disabled={busy}
                    className="pressable-action -ml-2 inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-muted hover:bg-paper hover:text-ink"
                  >
                    <LuArrowLeft aria-hidden="true" className="size-4" />
                    Back to resumes
                  </button>
                }
                title="Leave this import?"
                description="Discard your unsaved review and return to resumes."
                confirmLabel="Discard and leave"
                action={() => {
                  completed.current = true;
                  router.push("/");
                }}
              />
            ) : (
              <button
                type="button"
                onClick={() => router.push("/")}
                className="pressable-action -ml-2 inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-muted hover:bg-paper hover:text-ink"
              >
                <LuArrowLeft aria-hidden="true" className="size-4" />
                Back to resumes
              </button>
            )}
            <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  {review ? "Review your resume" : "Import a resume"}
                </h1>
                <p className="text-sm leading-relaxed text-muted">
                  {review ? fileName : "Bring your experience into Ogma."}
                </p>
              </div>
              {review && (
                <ConfirmationDialog
                  trigger={
                    <button
                      type="button"
                      disabled={busy || Boolean(submission)}
                      className="pressable-action inline-flex min-h-10 items-center gap-2 rounded-lg border border-line bg-paper px-3 text-sm font-medium hover:bg-canvas disabled:opacity-50"
                    >
                      <LuRefreshCw aria-hidden="true" className="size-4" />
                      Change file
                    </button>
                  }
                  title="Choose a different file?"
                  description="This will discard your current review."
                  confirmLabel="Choose another file"
                  action={() => {
                    setReview(undefined);
                    setDocument(undefined);
                    setDrafts(new Set());
                    setError("");
                  }}
                />
              )}
            </header>
          </div>
          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"
            >
              <LuCircleAlert
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0"
              />
              {error}
            </div>
          )}
          {!review && (
            <section
              aria-label="Upload resume"
              onDragOver={(event) => {
                event.preventDefault();
                if (!busy) setDragging(true);
              }}
              onDragLeave={(event) => {
                if (
                  !event.currentTarget.contains(
                    event.relatedTarget as Node | null,
                  )
                )
                  setDragging(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                const file = event.dataTransfer.files[0];
                if (file && !busy) void read(file);
              }}
              data-dragging={dragging}
              className="mx-auto flex w-full max-w-3xl flex-col items-center rounded-3xl border border-line bg-paper px-6 py-16 text-center shadow-sm data-[dragging=true]:border-accent data-[dragging=true]:bg-accent-soft sm:py-24"
            >
              <div className="mb-6 grid size-16 place-items-center rounded-2xl border border-line bg-canvas text-accent">
                {busy ? (
                  <LuLoaderCircle
                    aria-hidden="true"
                    className="size-7 animate-spin motion-reduce:animate-none"
                  />
                ) : (
                  <LuFileText aria-hidden="true" className="size-7" />
                )}
              </div>
              <h2 className="text-xl font-semibold tracking-tight">
                {busy
                  ? "Reading your resume…"
                  : "Start with the resume you have"}
              </h2>
              <p
                role={busy ? "status" : undefined}
                className="mt-2 max-w-sm text-sm leading-relaxed text-muted"
              >
                {busy ? fileName : "Drop a PDF or Word document here."}
              </p>
              <input
                id={fileInputId}
                type="file"
                accept=".pdf,.docx"
                disabled={busy}
                className="peer sr-only"
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  if (file) void read(file);
                  event.currentTarget.value = "";
                }}
              />
              <label
                htmlFor={fileInputId}
                aria-disabled={busy}
                className="pressable-action mt-7 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-white shadow-sm peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-accent hover:bg-accent-hover aria-disabled:pointer-events-none aria-disabled:opacity-50"
              >
                <LuUpload aria-hidden="true" className="size-4" />
                Choose a file
              </label>
              <p className="mt-4 text-xs text-muted">
                PDF or DOCX · Up to 1 MB
              </p>
            </section>
          )}
          {review && document && (
            <>
              {(review.requiresManualEntry || review.warnings.length > 0) && (
                <div
                  role="status"
                  className="flex items-start gap-3 rounded-xl border border-line bg-paper p-4 text-sm"
                >
                  <LuCircleAlert
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-accent"
                  />
                  <div className="flex flex-col gap-1">
                    {review.requiresManualEntry && (
                      <p>
                        We couldn’t find selectable text. Add your details below
                        or try another file.
                      </p>
                    )}
                    {review.warnings.map((warning) => (
                      <p key={warning}>{warning}</p>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
                <div className="order-2 flex min-w-0 flex-col gap-5 xl:order-1">
                  <label className="flex flex-col gap-2 text-sm font-medium">
                    Resume name
                    <input
                      value={title}
                      maxLength={120}
                      disabled={busy || Boolean(submission)}
                      onChange={(event) => setTitle(event.currentTarget.value)}
                      className="min-h-12 rounded-xl border border-line bg-paper px-4 text-base font-normal"
                    />
                  </label>
                  <div
                    inert={busy || Boolean(submission)}
                    className="rounded-2xl border border-line bg-paper p-3 sm:p-5"
                  >
                    <ResumeContentForm
                      guidance="Open a section to make changes."
                      onPreviewChange={onPreviewChange}
                      content={document.content}
                      order={(
                        document.sectionOrder ??
                        (Object.keys(sectionTitles) as EditorSectionId[])
                      ).filter(
                        (section) =>
                          showAllSections ||
                          section === "personal" ||
                          (section === "summary"
                            ? Boolean(document.content.summary.trim())
                            : Boolean(document.content[section]?.length)),
                      )}
                      onReorder={(sectionOrder) =>
                        setDocument({ ...document, sectionOrder })
                      }
                      hidden={new Set(document.hidden)}
                      onToggle={(key) =>
                        setDocument({
                          ...document,
                          hidden: document.hidden.includes(key)
                            ? document.hidden.filter((item) => item !== key)
                            : [...document.hidden, key],
                        })
                      }
                      onPhoto={(photo, photoCrop) =>
                        setDocument((current) =>
                          current ? { ...current, photo, photoCrop } : current,
                        )
                      }
                      photo={document.photo}
                      photoCrop={document.photoCrop}
                      showWorkProjects={false}
                      initialPersonalDetailsOpen={false}
                      onChange={(content) =>
                        setDocument((current) =>
                          current ? { ...current, content } : current,
                        )
                      }
                      onDraftChange={onDraftChange}
                      titles={document.sectionTitles ?? {}}
                      onRename={(section, value) =>
                        setDocument({
                          ...document,
                          sectionTitles: {
                            ...document.sectionTitles,
                            [section]: value,
                          },
                        })
                      }
                    />
                    {!showAllSections && (
                      <button
                        type="button"
                        onClick={() => setShowAllSections(true)}
                        className="pressable-action mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-medium text-accent hover:bg-accent-soft"
                      >
                        <LuChevronDown aria-hidden="true" className="size-4" />
                        Show all sections
                      </button>
                    )}
                  </div>
                </div>
                <aside
                  aria-label="Import source"
                  className="order-1 flex min-w-0 flex-col gap-4 xl:sticky xl:top-6 xl:order-2"
                >
                  <div className="overflow-hidden rounded-2xl border border-line bg-paper">
                    <div className="flex items-center gap-3 p-4">
                      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
                        <LuFileCheck2 aria-hidden="true" className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <h2
                          className="truncate text-sm font-semibold"
                          title={fileName}
                        >
                          {fileName}
                        </h2>
                        <p className="mt-0.5 text-xs text-muted">
                          {review.pageCount
                            ? formatPageCount(review.pageCount) + " · "
                            : ""}
                          Ready to review
                        </p>
                      </div>
                    </div>
                    <details className="group border-t border-line">
                      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-medium">
                        <span className="inline-flex items-center gap-2">
                          <LuFileText
                            aria-hidden="true"
                            className="size-4 text-muted"
                          />
                          Extracted text
                        </span>
                        <LuChevronDown
                          aria-hidden="true"
                          className="size-4 text-muted transition-transform duration-150 group-open:rotate-180 motion-reduce:transition-none"
                        />
                      </summary>
                      <div className="max-h-96 overflow-auto border-t border-line px-4 py-3 text-sm leading-relaxed wrap-anywhere whitespace-pre-wrap">
                        {review.text || "No selectable text found."}
                      </div>
                    </details>
                    {review.links.length > 0 && (
                      <details className="group border-t border-line">
                        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-medium">
                          <span className="inline-flex items-center gap-2">
                            <LuLink
                              aria-hidden="true"
                              className="size-4 text-muted"
                            />
                            Link destinations
                          </span>
                          <LuChevronDown
                            aria-hidden="true"
                            className="size-4 text-muted transition-transform duration-150 group-open:rotate-180 motion-reduce:transition-none"
                          />
                        </summary>
                        <ul className="flex max-h-80 flex-col gap-4 overflow-auto border-t border-line p-4 text-sm">
                          {review.links.map((link, index) => (
                            <li
                              key={index}
                              className="flex flex-col gap-1 wrap-anywhere"
                            >
                              <span className="font-medium">
                                {link.label || "Link"}
                              </span>
                              <span className="text-xs leading-relaxed text-muted">
                                {link.url}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                  {review.unmapped && (
                    <details
                      open
                      className="overflow-hidden rounded-2xl border border-accent/20 bg-paper"
                    >
                      <summary className="flex min-h-12 cursor-pointer items-center gap-2 px-4 text-sm font-semibold text-accent">
                        <LuCircleAlert
                          aria-hidden="true"
                          className="size-4 shrink-0"
                        />
                        Needs your attention
                      </summary>
                      <div className="flex flex-col gap-3 border-t border-line p-4">
                        <p className="text-sm text-muted">
                          Place this text in the right section.
                        </p>
                        <div className="max-h-80 overflow-auto text-sm leading-relaxed wrap-anywhere whitespace-pre-wrap">
                          {review.unmapped}
                        </div>
                      </div>
                    </details>
                  )}
                </aside>
              </div>
              <footer className="import-toolbar relative z-10 flex flex-col gap-4 rounded-2xl border border-line bg-paper p-4 shadow-sm sm:p-5 lg:sticky lg:bottom-4 lg:shadow-lg">
                <div className="flex flex-col gap-3">
                  <label className="flex items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={addToLibrary}
                      disabled={busy || Boolean(submission)}
                      onChange={(event) =>
                        setAddToLibrary(event.currentTarget.checked)
                      }
                      className="mt-0.5 size-4 shrink-0 accent-accent"
                    />
                    <span className="flex items-center gap-2">
                      Save a copy to Library
                    </span>
                  </label>
                  <label className="flex items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      disabled={busy || Boolean(submission)}
                      checked={reviewed}
                      onChange={(event) =>
                        setReviewed(event.currentTarget.checked)
                      }
                      className="mt-0.5 size-4 shrink-0 accent-accent"
                    />
                    I have reviewed my content
                  </label>
                </div>
                <div className="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
                  {(busy || drafts.size > 0) && (
                    <p
                      role="status"
                      className="text-xs leading-relaxed text-muted"
                    >
                      {busy
                        ? "Creating your resume…"
                        : drafts.size > 0
                          ? "Save or cancel your section edits to continue."
                          : ""}
                    </p>
                  )}
                  <button
                    type="button"
                    disabled={busy || !reviewed || drafts.size > 0}
                    onClick={() => void save()}
                    className="pressable-action inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-white shadow-sm hover:bg-accent-hover disabled:opacity-50 sm:ml-auto"
                  >
                    {busy ? (
                      <LuLoaderCircle
                        aria-hidden="true"
                        className="size-4 animate-spin motion-reduce:animate-none"
                      />
                    ) : null}
                    Create resume
                    <LuArrowRight aria-hidden="true" className="size-4" />
                  </button>
                </div>
              </footer>
            </>
          )}
        </div>
      </WorkspaceShell>
    </div>
  );
};

export { ImportResume };
