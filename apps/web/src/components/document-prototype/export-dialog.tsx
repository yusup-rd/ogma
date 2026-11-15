"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { LuDownload, LuX } from "react-icons/lu";
import { useState } from "react";
import type { ResumeDraft } from "@/lib/document-prototype/resume-layout-model";

interface ExportDialogProps {
  draft: ResumeDraft | null;
}

const formats = [
  {
    value: "pdf",
    label: "PDF",
    description: "Matches the A4 preview. Text stays selectable.",
  },
  {
    value: "docx",
    label: "Word (.docx)",
    description: "Editable text in a single-column Word layout.",
  },
] as const;
type ExportFormat = (typeof formats)[number]["value"];

const ExportDialog = ({ draft }: ExportDialogProps) => {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ExportFormat>("pdf");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const download = async () => {
    if (!draft) return;
    setPending(true);
    setError("");

    try {
      const response = await fetch(`/api/resume-layouts/resume.${format}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!response.ok) {
        throw new Error("Export unavailable");
      }

      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = `resume.${format}`;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setOpen(false);
    } catch {
      setError("Couldn’t download this format. Try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!pending) {
          setOpen(nextOpen);
          setError("");
        }
      }}
    >
      <Dialog.Trigger asChild disabled={!draft}>
        <button
          type="button"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-accent px-3.5 text-sm font-semibold text-white hover:bg-accent-hover"
        >
          <LuDownload aria-hidden="true" className="size-4" />
          Export
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-20 bg-ink/35" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-30 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col gap-5 overflow-auto rounded-2xl border border-line bg-paper p-5 shadow-xl sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1.5">
              <Dialog.Title className="text-2xl font-semibold tracking-tight">
                Export resume
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted">
                Choose a format for this resume.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close export dialog"
                disabled={pending}
                className="grid size-11 shrink-0 place-items-center rounded-lg text-muted hover:bg-canvas"
              >
                <LuX aria-hidden="true" className="size-4" />
              </button>
            </Dialog.Close>
          </div>

          <fieldset className="flex flex-col gap-2.5" disabled={pending}>
            <legend className="sr-only">Export format</legend>
            {formats.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-3.5 has-checked:border-accent/30 has-checked:bg-accent-soft"
              >
                <input
                  type="radio"
                  name="export-format"
                  checked={format === option.value}
                  onChange={() => setFormat(option.value)}
                  className="mt-0.5 size-4 shrink-0 accent-accent"
                />
                <span className="flex flex-col gap-1">
                  <span className="text-sm font-semibold">{option.label}</span>
                  <span className="text-xs text-muted">
                    {option.description}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>
          {error && (
            <p role="alert" className="text-sm text-red-800">
              {error}
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <Dialog.Close asChild>
              <button
                type="button"
                disabled={pending}
                className="min-h-11 rounded-lg border border-line px-3.5 text-sm font-semibold hover:bg-canvas"
              >
                Cancel
              </button>
            </Dialog.Close>
            <button
              type="button"
              onClick={() => void download()}
              disabled={pending}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-accent px-3.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
            >
              <LuDownload aria-hidden="true" className="size-4" />
              {pending
                ? "Preparing download…"
                : format === "pdf"
                  ? "Download PDF"
                  : "Download Word"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export { ExportDialog };
