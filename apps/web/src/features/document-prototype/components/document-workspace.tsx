"use client";

import { ChevronLeft, Eye, FileText } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { ExportDialog } from "./export-dialog";

const DocumentWorkspace = () => {
  const [includeHighlights, setIncludeHighlights] = useState(true);
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");
  const query = includeHighlights ? "" : "?highlights=hidden";

  return (
    <main className="flex min-h-dvh flex-col bg-canvas text-ink lg:h-dvh">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-paper px-4 py-3 lg:gap-5 lg:px-6">
        <Image src="/icon.svg" alt="Ogma" width={32} height={32} />
        <div className="hidden items-center gap-2 border-r border-line pr-5 text-sm text-muted lg:flex">
          <ChevronLeft aria-hidden="true" className="size-4" />
          <span>Resumes</span>
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-sm font-semibold sm:text-base">
            Senior product designer
          </h1>
          <p className="text-xs text-muted">
            Sample resume · Changes apply to this session
          </p>
        </div>
        <ExportDialog query={query} />
      </header>

      <div
        className="grid grid-cols-2 gap-1 border-b border-line bg-paper p-2 lg:hidden"
        aria-label="Workspace view"
      >
        <button
          type="button"
          aria-pressed={mobileView === "edit"}
          onClick={() => setMobileView("edit")}
          className="min-h-11 rounded-md text-sm font-semibold text-muted aria-pressed:bg-accent-soft aria-pressed:text-accent"
        >
          Edit
        </button>
        <button
          type="button"
          aria-pressed={mobileView === "preview"}
          onClick={() => setMobileView("preview")}
          className="min-h-11 rounded-md text-sm font-semibold text-muted aria-pressed:bg-accent-soft aria-pressed:text-accent"
        >
          Preview
        </button>
      </div>

      <div className="min-h-0 flex-1 lg:grid lg:grid-cols-[minmax(21rem,34.3%)_minmax(0,1fr)]">
        <section
          aria-labelledby="content-heading"
          className={`${mobileView === "edit" ? "flex" : "hidden"} min-h-0 flex-col bg-paper lg:flex lg:overflow-auto lg:border-r lg:border-line`}
        >
          <div className="border-b border-line px-5 py-4">
            <span className="rounded-md bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent">
              Content
            </span>
          </div>
          <div className="flex flex-col gap-5 px-5 py-6">
            <div className="flex flex-col gap-1">
              <h2
                id="content-heading"
                className="text-2xl font-semibold tracking-tight"
              >
                Content
              </h2>
              <p className="text-sm text-muted">
                Choose what this sample resume includes.
              </p>
            </div>

            <div className="rounded-xl border border-line p-4">
              <div className="flex items-center gap-3">
                <FileText aria-hidden="true" className="size-4 text-accent" />
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-semibold">Personal details</h3>
                  <p className="text-xs text-muted">
                    Alex Morgan · Senior product designer
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-line p-4">
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold">Experience</h3>
                <p className="text-xs text-muted">
                  Northstar Studio · 2022–Present
                </p>
              </div>
              <label className="flex min-h-11 items-center gap-3 border-t border-line pt-2 text-sm">
                <input
                  type="checkbox"
                  checked={includeHighlights}
                  onChange={(event) =>
                    setIncludeHighlights(event.currentTarget.checked)
                  }
                  className="size-4 shrink-0 accent-accent"
                />
                <span>Include experience highlights</span>
              </label>
            </div>

            <div className="rounded-xl border border-line p-4">
              <h3 className="text-sm font-semibold">Проекты</h3>
              <p className="mt-1 text-xs text-muted">
                Open Design System · Page 2
              </p>
            </div>
          </div>
        </section>

        <section
          aria-label="A4 preview"
          className={`${mobileView === "preview" ? "flex" : "hidden"} h-[calc(100dvh-8rem)] min-h-0 flex-col gap-3 bg-preview p-3 lg:flex lg:h-auto lg:px-8 lg:pt-5`}
        >
          <div className="flex min-h-11 shrink-0 items-center gap-3 rounded-xl border border-line bg-paper px-4">
            <Eye aria-hidden="true" className="size-4 text-muted" />
            <h2 className="text-sm font-semibold">Preview</h2>
            <p className="text-xs text-muted">A4 · 2 pages</p>
          </div>
          <iframe
            className="min-h-0 w-full flex-1 border-0"
            src={`/api/document-prototype/preview${query}`}
            title="Alex Morgan’s sample resume preview"
          />
        </section>
      </div>
    </main>
  );
};

export { DocumentWorkspace };
