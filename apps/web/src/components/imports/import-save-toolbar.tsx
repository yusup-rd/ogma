import { LuArrowRight, LuLoaderCircle } from "react-icons/lu";

interface ImportSaveToolbarProps {
  busy: boolean;
  disabled: boolean;
  reviewed: boolean;
  addToLibrary: boolean;
  draftCount: number;
  onReviewedChange: (reviewed: boolean) => void;
  onAddToLibraryChange: (addToLibrary: boolean) => void;
  onSave: () => void;
}

const ImportSaveToolbar = ({
  busy,
  disabled,
  reviewed,
  addToLibrary,
  draftCount,
  onReviewedChange,
  onAddToLibraryChange,
  onSave,
}: ImportSaveToolbarProps) => {
  return (
    <footer className="import-toolbar relative z-10 flex flex-col gap-4 rounded-2xl border border-line bg-paper p-4 shadow-sm sm:p-5 lg:sticky lg:bottom-4 lg:shadow-lg">
      <div className="flex flex-col gap-3">
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={addToLibrary}
            disabled={disabled}
            onChange={(event) =>
              onAddToLibraryChange(event.currentTarget.checked)
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
            disabled={disabled}
            checked={reviewed}
            onChange={(event) => onReviewedChange(event.currentTarget.checked)}
            className="mt-0.5 size-4 shrink-0 accent-accent"
          />
          I have reviewed my content
        </label>
      </div>
      <div className="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
        {(busy || draftCount > 0) && (
          <p role="status" className="text-xs leading-relaxed text-muted">
            {busy
              ? "Creating your resume…"
              : "Save or cancel your section edits to continue."}
          </p>
        )}
        <button
          type="button"
          disabled={busy || !reviewed || draftCount > 0}
          onClick={onSave}
          className="pressable-action inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-white shadow-sm hover:bg-accent-hover disabled:opacity-50 sm:ml-auto"
        >
          {busy && (
            <LuLoaderCircle
              aria-hidden="true"
              className="size-4 animate-spin motion-reduce:animate-none"
            />
          )}
          Create resume
          <LuArrowRight aria-hidden="true" className="size-4" />
        </button>
      </div>
    </footer>
  );
};

export { ImportSaveToolbar };
