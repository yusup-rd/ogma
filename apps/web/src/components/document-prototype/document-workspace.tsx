"use client";

import { LuChevronLeft, LuFileText, LuPalette } from "react-icons/lu";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useState } from "react";
import type { SavedResume } from "@ogma/contracts/resume-workspace";
import { SignOutDialog } from "@/components/owner-auth/sign-out-dialog";
import { ResumeConflictDialog } from "@/components/resumes/resume-conflict-dialog";
import { CheckpointHistory } from "@/components/resumes/checkpoint-history";
import { useResumeLayouts } from "@/hooks/document-prototype/use-resume-layouts";
import { useResumeAutosave } from "@/hooks/resumes/use-resume-autosave";
import { ExportDialog } from "./export-dialog";
import { ResumeContentForm } from "./resume-content-form";
import { ResumePreview } from "./resume-preview";

const TemplateGallery = dynamic(() =>
  import("./template-gallery").then((module) => module.TemplateGallery),
);
const TemplateDesignForm = dynamic(() =>
  import("./template-design-form").then((module) => module.TemplateDesignForm),
);

interface DocumentWorkspaceProps {
  resume: SavedResume;
}

const DocumentWorkspace = ({ resume }: DocumentWorkspaceProps) => {
  const model = useResumeLayouts(resume.document);
  const [title, setTitle] = useState(resume.title);
  const savedTitle = title.trim() || "Untitled resume";
  const autosave = useResumeAutosave(resume, savedTitle, model.document);
  const [screen, setScreen] = useState<"Content" | "Design">("Content");
  const [mobileView, setMobileView] = useState<"Edit" | "Preview">("Edit");

  return (
    <main className="flex min-h-dvh flex-col bg-canvas text-ink lg:h-dvh">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-paper px-4 py-3 lg:min-h-19 lg:gap-5 lg:px-6">
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
          onClick={async () => {
            if ((await autosave.flush()) !== null)
              window.location.assign(new URL("/", window.location.origin));
          }}
          className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg px-1.5 text-xs font-semibold hover:bg-canvas sm:px-2"
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
            placeholder="Untitled resume"
            maxLength={120}
            onBlur={() => setTitle(savedTitle)}
            onChange={(event) => setTitle(event.currentTarget.value)}
          />
          <div className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted">
            <p role="status">
              {autosave.phase === "saved"
                ? "Saved"
                : autosave.phase === "saving"
                  ? "Saving…"
                  : autosave.phase === "conflict"
                    ? "Save conflict"
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
        <CheckpointHistory
          resumeId={resume.id}
          beforeAction={autosave.flush}
          onConflict={autosave.reportConflict}
          onRestored={autosave.reload}
        />
        <ExportDialog
          resumeId={resume.id}
          ready={Boolean(model.template)}
          beforeExport={autosave.flush}
          onConflict={autosave.reportConflict}
        />
        <SignOutDialog beforeSignOut={autosave.flush} />
      </header>
      <ResumeConflictDialog
        open={autosave.conflictOpen}
        onOpenChange={autosave.setConflictOpen}
        onReload={autosave.reload}
        onSaveCopy={autosave.saveCopy}
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
          <p role="alert" className="text-red-800">
            {model.error}
          </p>
          <button
            type="button"
            className="min-h-10 shrink-0 rounded-md border border-line px-3 font-semibold"
            onClick={model.retry}
          >
            Retry
          </button>
        </div>
      )}

      <div className="min-h-0 flex-1 lg:grid lg:grid-cols-[minmax(21rem,34.3%)_minmax(0,1fr)]">
        <section
          aria-label="Resume controls"
          className={`${mobileView === "Edit" ? "flex" : "hidden"} min-h-0 flex-col bg-paper lg:flex lg:overflow-auto lg:border-r lg:border-line`}
        >
          <div className="flex gap-1 border-b border-line bg-paper px-4 py-2 lg:sticky lg:top-0 lg:z-10 lg:px-5">
            {(
              [
                ["Content", LuFileText],
                ["Design", LuPalette],
              ] as const
            ).map(([name, Icon]) => (
              <button
                key={name}
                type="button"
                aria-pressed={screen === name}
                onClick={() => setScreen(name)}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-md px-3 text-xs font-semibold text-muted aria-pressed:bg-accent-soft aria-pressed:text-accent"
              >
                <Icon aria-hidden="true" className="size-4 shrink-0" />
                {name}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-5 px-5 py-6">
            {!model.catalog && !model.error && (
              <p role="status" className="text-sm text-muted">
                Loading templates…
              </p>
            )}
            {model.content && (
              <div hidden={screen !== "Content"}>
                <ResumeContentForm
                  content={model.content}
                  photo={model.photo}
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
                />
              </div>
            )}
            {screen === "Design" &&
              model.catalog &&
              model.template &&
              model.style && (
                <>
                  <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-semibold tracking-tight">
                      Design
                    </h2>
                    <p className="text-sm text-muted">
                      Each template keeps its own style settings.
                    </p>
                  </div>
                  <TemplateDesignForm
                    gallery={
                      <TemplateGallery
                        templates={model.catalog.layouts}
                        active={model.template.id}
                        onSelect={model.setTemplate}
                      />
                    }
                    template={model.template}
                    style={model.style}
                    fonts={model.catalog.fonts}
                    onChange={model.updateStyle}
                    onReset={model.resetStyle}
                  />
                </>
              )}
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
        />
      </div>
    </main>
  );
};

export { DocumentWorkspace };
