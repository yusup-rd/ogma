"use client";

import { LuFileText, LuPalette } from "react-icons/lu";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useState } from "react";
import { useResumeLayouts } from "@/hooks/document-prototype/use-resume-layouts";
import { ExportDialog } from "./export-dialog";
import { ResumeContentForm } from "./resume-content-form";
import { ResumePreview } from "./resume-preview";

const TemplateGallery = dynamic(() =>
  import("./template-gallery").then((module) => module.TemplateGallery),
);
const TemplateDesignForm = dynamic(() =>
  import("./template-design-form").then((module) => module.TemplateDesignForm),
);

const DocumentWorkspace = () => {
  const model = useResumeLayouts();
  const [screen, setScreen] = useState<"Content" | "Design">("Content");
  const [mobileView, setMobileView] = useState<"Edit" | "Preview">("Edit");

  return (
    <main className="flex min-h-dvh flex-col bg-canvas text-ink lg:h-dvh">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-paper px-4 py-3 lg:min-h-19 lg:gap-5 lg:px-6">
        <Image src="/icon.svg" alt="Ogma" width={32} height={32} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold sm:text-base">
            {model.content?.targetTitle || "Resume editor"}
          </h1>
          <p className="text-xs text-muted">
            Draft · Changes apply to this session
          </p>
        </div>
        <ExportDialog draft={model.exportDraft} />
      </header>

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
                  showSkillLevels={Boolean(model.template?.showSkillLevels)}
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
                    photo={model.photo}
                    logo={model.logo}
                    onPhoto={model.setPhoto}
                    onLogo={model.setLogo}
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
