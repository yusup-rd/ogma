import type { ChangeEvent, DragEvent } from "react";
import { LuFileText, LuLoaderCircle, LuUpload } from "react-icons/lu";

interface ImportUploadPanelProps {
  fileInputId: string;
  busy: boolean;
  dragging: boolean;
  fileName: string;
  onDraggingChange: (dragging: boolean) => void;
  onFile: (file: File) => void;
}

const ImportUploadPanel = ({
  fileInputId,
  busy,
  dragging,
  fileName,
  onDraggingChange,
  onFile,
}: ImportUploadPanelProps) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (file) onFile(file);
    event.currentTarget.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    onDraggingChange(false);
    const file = event.dataTransfer.files[0];
    if (file && !busy) onFile(file);
  };

  return (
    <section
      aria-label="Upload resume"
      onDragOver={(event) => {
        event.preventDefault();
        if (!busy) onDraggingChange(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          onDraggingChange(false);
      }}
      onDrop={handleDrop}
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
        {busy ? "Reading your resume…" : "Start with the resume you have"}
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
        onChange={handleChange}
      />
      <label
        htmlFor={fileInputId}
        aria-disabled={busy}
        className="pressable-action mt-7 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-white shadow-sm peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-accent hover:bg-accent-hover aria-disabled:pointer-events-none aria-disabled:opacity-50"
      >
        <LuUpload aria-hidden="true" className="size-4" />
        Choose a file
      </label>
      <p className="mt-4 text-xs text-muted">PDF or DOCX · Up to 1 MB</p>
    </section>
  );
};

export { ImportUploadPanel };
