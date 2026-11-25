"use client";

import {
  LuChevronLeft,
  LuFileText,
  LuPalette,
  LuListChecks,
} from "react-icons/lu";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import type { SavedResume } from "@ogma/contracts/resume-workspace";
import { ResumeLibraryDialog } from "@/components/content-library/resume-library-dialog";
import { SignOutDialog } from "@/components/owner-auth/sign-out-dialog";
import { ResumeConflictDialog } from "@/components/resumes/resume-conflict-dialog";
import { CheckpointHistory } from "@/components/resumes/checkpoint-history";
import { ResumeLockDialog } from "@/components/resumes/resume-lock-dialog";
import { InlineAlert } from "@/components/ui/inline-alert";
import { useResumeLayouts } from "@/hooks/document-prototype/use-resume-layouts";
import { useResumeHistoryGuard } from "@/hooks/resumes/use-resume-history-guard";
import { useResumeAutosave } from "@/hooks/resumes/use-resume-autosave";
import type { EditorSectionId } from "@/lib/document-prototype/content-presentation";
import { ExportDialog } from "./export-dialog";
import { ResumeContentForm } from "./resume-content-form";
import { ResumePreview } from "./resume-preview";

const TemplateGallery = dynamic(() =>
  import("./template-gallery").then((module) => module.TemplateGallery),
);
const ResumeCheck = dynamic(() =>
  import("@/components/resumes/resume-check").then(
    (module) => module.ResumeCheck,
  ),
);
const TemplateDesignForm = dynamic(() =>
  import("./template-design-form").then((module) => module.TemplateDesignForm),
);

interface DocumentWorkspaceProps {
  resume: SavedResume;
}

const DocumentWorkspace = ({ resume }: DocumentWorkspaceProps) => {
  const router = useRouter();
  const model = useResumeLayouts(resume.document);
  const [title, setTitle] = useState(resume.title);
  const savedTitle = title.trim() || "Untitled resume";
  const [sectionDrafts, setSectionDrafts] = useState(
    () => new Set<EditorSectionId>(),
  );
  const sectionDraftsRef = useRef(sectionDrafts);
  const onDraftChange = useCallback(
    (section: EditorSectionId, hasDraft: boolean) => {
      const current = sectionDraftsRef.current;
      if (current.has(section) === hasDraft) return;
      const next = new Set(current);
      if (hasDraft) next.add(section);
      else next.delete(section);
      sectionDraftsRef.current = next;
      setSectionDrafts(next);
    },
    [],
  );
  const hasSectionDrafts = sectionDrafts.size > 0;
  const autosave = useResumeAutosave(
    resume,
    savedTitle,
    model.document,
    hasSectionDrafts,
  );
  const [screen, setScreen] = useState<"Content" | "Design" | "Resume Check">(
    "Content",
  );
  const [checkOpened, setCheckOpened] = useState(false);
  const [mobileView, setMobileView] = useState<"Edit" | "Preview">("Edit");
  const [leaving, setLeaving] = useState(false);
  const [leaveAfterPreview, setLeaveAfterPreview] = useState(false);
  const [previewReset, setPreviewReset] = useState(0);
  const draftNotice = useRef<HTMLParagraphElement>(null);
  const leaveDestination = useRef<() => void>(() => router.push("/"));
  const requireSavedSections = async () => {
    if (
      autosave.locked &&
      (autosave.previewChanged || sectionDraftsRef.current.size > 0)
    ) {
      autosave.setLockPromptOpen(true);
      return null;
    }
    const revealDrafts = () => {
      if (sectionDraftsRef.current.size === 0) return false;
      setScreen("Content");
      setMobileView("Edit");
      requestAnimationFrame(() => draftNotice.current?.focus());
      return true;
    };
    if (revealDrafts()) return null;
    const revision = await autosave.flush();
    return revealDrafts() ? null : revision;
  };
  const backToResumes = async (navigate = () => router.push("/")) => {
    leaveDestination.current = navigate;
    if (
      autosave.locked &&
      (autosave.previewChanged || sectionDraftsRef.current.size > 0)
    ) {
      setLeaveAfterPreview(true);
      autosave.setLockPromptOpen(true);
      return;
    }
    if (sectionDraftsRef.current.size > 0) {
      setScreen("Content");
      setMobileView("Edit");
      requestAnimationFrame(() => draftNotice.current?.focus());
      return;
    }
    setLeaving(true);
    const savedRevision = await requireSavedSections();
    if (savedRevision === null) {
      setLeaving(false);
      return;
    }
    navigate();
  };
  useResumeHistoryGuard(autosave.isNavigationDirty, (proceed) => {
    void backToResumes(proceed);
  });
  const gallery = model.catalog && (
    <TemplateGallery
      templates={model.catalog.layouts}
      active={model.document.layoutId}
      onSelect={model.setTemplate}
    />
  );

  return (
    <main className="flex min-h-dvh flex-col bg-canvas text-ink lg:h-dvh">
      <header
        inert={autosave.lockBusy}
        className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-paper px-4 py-3 lg:min-h-19 lg:gap-5 lg:px-6"
      >
        <Image
          src="/icon.svg"
          alt="Ogma"
          width={32}
          height={32}
          className="hidden sm:block"
        />
        <button
          type="button"
          aria-label="Back to resumes"
          disabled={leaving}
          onClick={() => void backToResumes()}
          className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg px-1.5 text-xs font-semibold enabled:hover:bg-canvas disabled:opacity-60 sm:px-2"
        >
          <LuChevronLeft aria-hidden="true" className="size-4" />
          <span className="hidden sm:inline">Resumes</span>
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="sr-only">Resume editor</h1>
          <input
            aria-label="Resume name"
            className="w-full rounded-sm text-sm font-semibold focus-visible:outline-2 focus-visible:outline-accent sm:text-base"
            value={title}
            disabled={leaving}
            placeholder="Untitled resume"
            maxLength={120}
            onBlur={() => setTitle(savedTitle)}
            onChange={(event) => setTitle(event.currentTarget.value)}
          />
          <div className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted">
            <p role="status">
              {autosave.phase === "conflict"
                ? "Save conflict"
                : autosave.locked
                  ? autosave.previewChanged || hasSectionDrafts
                    ? "Locked · Unsaved preview changes"
                    : "Locked · Saved CV protected"
                  : autosave.phase === "saved"
                    ? hasSectionDrafts
                      ? "Unsaved section edits"
                      : "Saved"
                    : autosave.phase === "saving"
                      ? "Saving…"
                      : "Save failed"}
            </p>
            {autosave.phase === "error" && (
              <button
                type="button"
                className="font-semibold text-accent underline"
                onClick={() => void autosave.flush()}
              >
                Retry save
              </button>
            )}
            {autosave.phase === "conflict" && (
              <button
                type="button"
                className="font-semibold text-accent underline"
                onClick={() => autosave.setConflictOpen(true)}
              >
                Resolve
              </button>
            )}
          </div>
        </div>
        <ResumeLockDialog
          open={autosave.lockPromptOpen}
          onOpenChange={(open) => {
            autosave.setLockPromptOpen(open);
            setLeaveAfterPreview(false);
          }}
          locked={autosave.locked}
          changed={autosave.previewChanged || hasSectionDrafts}
          hasSectionDrafts={hasSectionDrafts}
          busy={autosave.lockBusy}
          error={autosave.lockError}
          leaving={leaveAfterPreview}
          onConfirm={() => {
            void autosave.changeLock(!autosave.locked).then((changed) => {
              if (changed && leaveAfterPreview) leaveDestination.current();
            });
          }}
          onDiscard={() => {
            model.setDocument(() => autosave.savedSnapshot.document);
            setTitle(autosave.savedSnapshot.title);
            setPreviewReset((current) => current + 1);
            autosave.setLockPromptOpen(false);
            if (leaveAfterPreview) {
              autosave.leaveWithoutChanges();
              leaveDestination.current();
            }
            setLeaveAfterPreview(false);
          }}
        />
        <CheckpointHistory
          resumeId={resume.id}
          locked={autosave.locked}
          beforeAction={requireSavedSections}
          onConflict={autosave.reportConflict}
          onRestored={autosave.reloadFromServer}
        />
        <ExportDialog
          resumeId={resume.id}
          ready={Boolean(model.template)}
          beforeExport={requireSavedSections}
          onConflict={autosave.reportConflict}
        />
        <SignOutDialog
          beforeSignOut={() => {
            if (
              autosave.locked &&
              (autosave.previewChanged || sectionDraftsRef.current.size > 0)
            ) {
              throw new Error(
                "This CV is locked. Cancel sign-out, then discard the preview or unlock and save your changes.",
              );
            }
            if (sectionDraftsRef.current.size > 0) {
              setScreen("Content");
              setMobileView("Edit");
              throw new Error(
                "Choose Save or Cancel in each edited section before signing out.",
              );
            }
            return requireSavedSections();
          }}
        />
      </header>
      {autosave.locked && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-accent-soft px-5 py-3 text-sm text-accent"
        >
          <p>
            {autosave.previewChanged || hasSectionDrafts
              ? "Preview changes are not saved. Unlock this CV to keep them, or discard them to return to the saved design."
              : "This CV is locked. You can experiment with content and design without changing the saved CV."}
          </p>
          {(autosave.previewChanged || hasSectionDrafts) && (
            <button
              type="button"
              onClick={() => autosave.setLockPromptOpen(true)}
              className="min-h-10 shrink-0 rounded-lg border border-accent/25 px-3 text-sm font-semibold hover:bg-paper active:bg-paper"
            >
              Review preview changes
            </button>
          )}
        </div>
      )}
      <ResumeConflictDialog
        open={autosave.conflictOpen}
        onOpenChange={(open) => {
          autosave.setConflictOpen(open);
          if (!open && hasSectionDrafts) {
            setScreen("Content");
            setMobileView("Edit");
          }
        }}
        onReload={autosave.reloadFromServer}
        onSaveCopy={autosave.saveCopy}
        hasSectionDrafts={hasSectionDrafts}
      />

      <div
        className="grid grid-cols-2 gap-1 border-b border-line bg-paper p-2 lg:hidden"
        aria-label="Workspace view"
      >
        {(["Edit", "Preview"] as const).map((view) => (
          <button
            key={view}
            type="button"
            aria-pressed={mobileView === view}
            onClick={() => setMobileView(view)}
            className="min-h-11 rounded-md text-sm font-semibold text-muted aria-pressed:bg-accent-soft aria-pressed:text-accent"
          >
            {view}
          </button>
        ))}
      </div>

      {model.error && (
        <div className="flex items-center justify-between gap-3 border-b border-line bg-paper px-5 py-3 text-sm">
          <InlineAlert>{model.error}</InlineAlert>
          <button
            type="button"
            className="min-h-10 shrink-0 rounded-md border border-line px-3 font-semibold"
            onClick={model.retry}
          >
            Retry
          </button>
        </div>
      )}

      <div
        inert={leaving || autosave.lockBusy}
        className="min-h-0 flex-1 lg:grid lg:grid-cols-[minmax(21rem,34.3%)_minmax(0,1fr)]"
      >
        <section
          aria-label="Resume controls"
          className={`${mobileView === "Edit" ? "flex" : "hidden"} min-h-0 flex-col bg-paper lg:flex lg:overflow-auto lg:border-r lg:border-line`}
        >
          <div className="flex gap-1 border-b border-line bg-paper px-4 py-2 lg:sticky lg:top-0 lg:z-10 lg:px-5">
            {(
              [
                ["Content", LuFileText],
                ["Design", LuPalette],
                ["Resume Check", LuListChecks],
              ] as const
            ).map(([name, Icon]) => (
              <button
                key={name}
                type="button"
                aria-pressed={screen === name}
                onClick={() => {
                  setScreen(name);
                  if (name === "Resume Check") setCheckOpened(true);
                }}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-md px-3 text-xs font-semibold text-muted aria-pressed:bg-accent-soft aria-pressed:text-accent"
              >
                <Icon aria-hidden="true" className="size-4 shrink-0" />
                {name}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-5 px-5 py-6">
            {hasSectionDrafts && screen === "Content" && (
              <p
                ref={draftNotice}
                tabIndex={-1}
                className="rounded-lg border border-line bg-canvas p-3 text-sm text-muted"
              >
                {autosave.locked
                  ? "Apply each edited section to the preview or Cancel it before unlocking."
                  : "Choose Save or Cancel in each edited section before leaving the editor."}
              </p>
            )}
            {!model.catalog && !model.error && (
              <p role="status" className="text-sm text-muted">
                Loading templates…
              </p>
            )}
            {model.catalog && !model.template && screen === "Content" && (
              <div className="flex items-center gap-3 rounded-lg border border-line bg-canvas p-3">
                <p role="status" className="text-sm text-muted">
                  This resume’s template is unavailable.
                </p>
                <button
                  type="button"
                  className="text-sm font-semibold text-accent underline"
                  onClick={() => setScreen("Design")}
                >
                  Choose a template
                </button>
              </div>
            )}
            {model.content && (
              <div hidden={screen !== "Content"}>
                <ResumeLibraryDialog
                  document={model.document}
                  disabled={hasSectionDrafts}
                  onChange={model.setDocument}
                />
                <ResumeContentForm
                  key={previewReset}
                  locked={autosave.locked}
                  content={model.content}
                  photo={model.photo}
                  photoCrop={model.document.photoCrop}
                  initialPersonalDetailsOpen={
                    resume.draftRevision === 1 &&
                    !resume.document.content.targetTitle &&
                    !Object.values(resume.document.content.contact).some(
                      Boolean,
                    )
                  }
                  onPhoto={model.setPhoto}
                  showWorkProjects={
                    model.style?.workProjectTables ??
                    model.template?.designDefaults.workProjectTables ??
                    false
                  }
                  onChange={model.setContent}
                  order={model.order}
                  onReorder={model.setOrder}
                  hidden={model.hidden}
                  onToggle={model.toggleVisibility}
                  onDraftChange={onDraftChange}
                  titles={model.sectionTitles}
                  onRename={model.setSectionTitle}
                  onPreviewChange={model.onPreviewChange}
                />
              </div>
            )}
            {screen === "Design" && model.catalog && (
              <>
                <div className="flex flex-col gap-1">
                  <h2 className="text-2xl font-semibold tracking-tight">
                    Design
                  </h2>
                  <p className="text-sm text-muted">
                    Each template keeps its own style settings.
                  </p>
                </div>
                {model.template && model.style ? (
                  <TemplateDesignForm
                    key={previewReset}
                    sectionOrder={model.order}
                    gallery={gallery}
                    template={model.template}
                    style={model.style}
                    fonts={model.catalog.fonts}
                    onChange={model.updateStyle}
                    onReset={model.resetStyle}
                  />
                ) : (
                  gallery
                )}
              </>
            )}
            <div hidden={screen !== "Resume Check"}>
              {checkOpened && (
                <ResumeCheck
                  resumeId={resume.id}
                  documentKey={JSON.stringify(model.document)}
                  initialRevision={resume.draftRevision}
                  initialDocumentKey={JSON.stringify(resume.document)}
                  dirty={hasSectionDrafts || autosave.previewChanged}
                  beforeRun={requireSavedSections}
                  onConflict={autosave.reportConflict}
                />
              )}
            </div>
          </div>
        </section>

        <ResumePreview
          html={model.preview?.html}
          pages={model.preview?.pages}
          paper={
            model.preview?.paper ??
            (model.style?.paperSize === "letter" ? "Letter" : "A4")
          }
          templateName={model.preview?.templateName ?? model.template?.name}
          mobileVisible={mobileView === "Preview"}
          hasUnsavedChanges={
            hasSectionDrafts || (autosave.locked && autosave.previewChanged)
          }
        />
      </div>
    </main>
  );
};

export { DocumentWorkspace };
