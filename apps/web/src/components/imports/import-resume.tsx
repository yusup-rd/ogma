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
  LuChevronDown,
  LuCircleAlert,
  LuRefreshCw,
} from "react-icons/lu";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { ImportUploadPanel } from "@/components/imports/import-upload-panel";
import { ImportSourcePanel } from "@/components/imports/import-source-panel";
import { ImportSaveToolbar } from "@/components/imports/import-save-toolbar";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
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
      if (libraryEntries.length > 400) {
        setError(
          "Library copies are limited to 400 entries per import. Turn off Save a copy to Library to create this resume without Library copies.",
        );
        setBusy(false);
        return;
      }
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
            <ImportUploadPanel
              fileInputId={fileInputId}
              busy={busy}
              dragging={dragging}
              fileName={fileName}
              onDraggingChange={setDragging}
              onFile={(file) => void read(file)}
            />
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
                      onReorder={(sectionOrder) => {
                        const currentOrder =
                          document.sectionOrder ??
                          (Object.keys(sectionTitles) as EditorSectionId[]);
                        if (sectionOrder.length === currentOrder.length) {
                          setDocument({ ...document, sectionOrder });
                          return;
                        }
                        const visibleSections = new Set(sectionOrder);
                        let nextVisibleIndex = 0;
                        setDocument({
                          ...document,
                          sectionOrder: currentOrder.map((section) =>
                            visibleSections.has(section)
                              ? sectionOrder[nextVisibleIndex++]
                              : section,
                          ),
                        });
                      }}
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
                      onRename={(section, value) => {
                        const sectionTitles = { ...document.sectionTitles };
                        if (value.trim()) sectionTitles[section] = value.trim();
                        else delete sectionTitles[section];
                        setDocument({ ...document, sectionTitles });
                      }}
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
                <ImportSourcePanel fileName={fileName} review={review} />
              </div>
              <ImportSaveToolbar
                busy={busy}
                disabled={Boolean(submission)}
                reviewed={reviewed}
                addToLibrary={addToLibrary}
                draftCount={drafts.size}
                onReviewedChange={setReviewed}
                onAddToLibraryChange={setAddToLibrary}
                onSave={() => void save()}
              />
            </>
          )}
        </div>
      </WorkspaceShell>
    </div>
  );
};

export { ImportResume };
