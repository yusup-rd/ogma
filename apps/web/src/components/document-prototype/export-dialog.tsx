"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { LuDownload, LuX } from "react-icons/lu";
import { useEffect, useRef, useState } from "react";

interface ExportDialogProps {
  resumeId: string;
  ready: boolean;
  beforeExport: () => Promise<number | null>;
  onConflict: () => void;
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

const ExportDialog = ({
  resumeId,
  ready,
  beforeExport,
  onConflict,
}: ExportDialogProps) => {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ExportFormat>("pdf");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const activeRequest = useRef<AbortController>(null);
  useEffect(() => () => activeRequest.current?.abort(), []);

  const download = async () => {
    if (!ready || activeRequest.current) return;
    const request = new AbortController();
    activeRequest.current = request;
    setPending(true);
    setError("");

    try {
      const expectedRevision = await beforeExport();
      if (request.signal.aborted) return;
      if (expectedRevision === null) {
        setOpen(false);
        return;
      }
      const response = await fetch(
        `/api/resumes/${resumeId}/export/${format}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ expectedRevision }),
          signal: request.signal,
        },
      );
      if ([404, 409].includes(response.status)) {
        setOpen(false);
        onConflict();
        return;
      }
      if (!response.ok) {
        throw new Error("Export unavailable");
      }

      const blob = await response.blob();
      if (request.signal.aborted) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `resume.${format}`;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setOpen(false);
    } catch {
      if (!request.signal.aborted)
        setError("Couldn’t download this format. Try again.");
    } finally {
      if (activeRequest.current === request) {
        activeRequest.current = null;
        setPending(false);
      }
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          activeRequest.current?.abort();
          activeRequest.current = null;
          setPending(false);
        }
        setOpen(nextOpen);
        setError("");
      }}
    >
      <Dialog.Trigger asChild disabled={!ready}>
        <button
          type="button"
          disabled={!ready}
          aria-label="Export"
          className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg bg-accent text-sm font-semibold text-white hover:bg-accent-hover sm:px-3.5"
        >
          <LuDownload aria-hidden="true" className="size-4" />
          <span className="hidden sm:inline">Export</span>
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
                className="flex items-start gap-3 rounded-xl border border-line p-3.5 has-checked:border-accent/30 has-checked:bg-accent-soft"
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
