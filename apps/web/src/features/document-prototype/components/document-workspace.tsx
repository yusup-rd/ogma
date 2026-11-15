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
    <main className="bg-canvas text-ink flex min-h-dvh flex-col lg:h-dvh">
      <header className="border-line bg-paper sticky top-0 z-10 flex items-center gap-3 border-b px-4 py-3 lg:gap-5 lg:px-6">
        <Image src="/icon.svg" alt="Ogma" width={32} height={32} />
        <div className="border-line text-muted hidden items-center gap-2 border-r pr-5 text-sm lg:flex">
          <ChevronLeft aria-hidden="true" className="size-4" />
          <span>Resumes</span>
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-sm font-semibold sm:text-base">
            Senior product designer
          </h1>
          <p className="text-muted text-xs">
            Sample resume · Changes apply to this session
          </p>
        </div>
        <ExportDialog query={query} />
      </header>

      <div
        className="border-line bg-paper grid grid-cols-2 gap-1 border-b p-2 lg:hidden"
        aria-label="Workspace view"
      >
        <button
          type="button"
          aria-pressed={mobileView === "edit"}
          onClick={() => setMobileView("edit")}
          className="text-muted aria-pressed:bg-accent-soft aria-pressed:text-accent min-h-11 rounded-md text-sm font-semibold"
        >
          Edit
        </button>
        <button
          type="button"
          aria-pressed={mobileView === "preview"}
          onClick={() => setMobileView("preview")}
          className="text-muted aria-pressed:bg-accent-soft aria-pressed:text-accent min-h-11 rounded-md text-sm font-semibold"
        >
          Preview
        </button>
      </div>

      <div className="min-h-0 flex-1 lg:grid lg:grid-cols-[minmax(21rem,34.3%)_minmax(0,1fr)]">
        <section
          aria-labelledby="content-heading"
          className={`${mobileView === "edit" ? "flex" : "hidden"} bg-paper lg:border-line min-h-0 flex-col lg:flex lg:overflow-auto lg:border-r`}
        >
          <div className="border-line border-b px-5 py-4">
            <span className="bg-accent-soft text-accent rounded-md px-3 py-1.5 text-xs font-semibold">
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
              <p className="text-muted text-sm">
                Choose what this sample resume includes.
              </p>
            </div>

            <div className="border-line rounded-xl border p-4">
              <div className="flex items-center gap-3">
                <FileText aria-hidden="true" className="text-accent size-4" />
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-semibold">Personal details</h3>
                  <p className="text-muted text-xs">
                    Alex Morgan · Senior product designer
                  </p>
                </div>
              </div>
            </div>

            <div className="border-line flex flex-col gap-3 rounded-xl border p-4">
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-semibold">Experience</h3>
                <p className="text-muted text-xs">
                  Northstar Studio · 2022–Present
                </p>
              </div>
              <label className="border-line flex min-h-11 items-center gap-3 border-t pt-2 text-sm">
                <input
                  type="checkbox"
                  checked={includeHighlights}
                  onChange={(event) =>
                    setIncludeHighlights(event.currentTarget.checked)
                  }
                  className="accent-accent size-4 shrink-0"
                />
                <span>Include experience highlights</span>
              </label>
            </div>

            <div className="border-line rounded-xl border p-4">
              <h3 className="text-sm font-semibold">Проекты</h3>
              <p className="text-muted mt-1 text-xs">
                Open Design System · Page 2
              </p>
            </div>
          </div>
        </section>

        <section
          aria-label="A4 preview"
          className={`${mobileView === "preview" ? "flex" : "hidden"} bg-preview h-[calc(100dvh-8rem)] min-h-0 flex-col gap-3 p-3 lg:flex lg:h-auto lg:px-8 lg:pt-5`}
        >
          <div className="border-line bg-paper flex min-h-11 shrink-0 items-center gap-3 rounded-xl border px-4">
            <Eye aria-hidden="true" className="text-muted size-4" />
            <h2 className="text-sm font-semibold">Preview</h2>
            <p className="text-muted text-xs">A4 · 2 pages</p>
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
