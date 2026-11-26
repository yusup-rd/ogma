"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { DialogFrame } from "@/components/ui/dialog-frame";
import { InlineAlert } from "@/components/ui/inline-alert";
import { useRef, useState } from "react";
import { LuChevronRight, LuCopy, LuRefreshCw } from "react-icons/lu";

interface ResumeConflictDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReload: () => void;
  onSaveCopy: () => Promise<boolean>;
  hasSectionDrafts: boolean;
}

const ResumeConflictDialog = ({
  open,
  onOpenChange,
  onReload,
  onSaveCopy,
  hasSectionDrafts,
}: ResumeConflictDialogProps) => {
  const keepEditing = useRef<HTMLButtonElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const saveCopy = async () => {
    setBusy(true);
    setError("");
    try {
      if (!(await onSaveCopy()))
        setError(
          "Your edits changed. Resolve any unsaved sections and try again.",
        );
    } catch {
      setError("Couldn’t save a separate resume. Your edits are still here.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!busy) onOpenChange(next);
      }}
    >
      <DialogFrame
        size="xl"
        layer="top"
        contentProps={{
          onOpenAutoFocus: (event) => {
            event.preventDefault();
            keepEditing.current?.focus();
          },
        }}
      >
        <Dialog.Title className="text-xl font-semibold tracking-tight">
          This resume changed elsewhere
        </Dialog.Title>
        <Dialog.Description className="text-sm text-muted">
          {hasSectionDrafts
            ? "Choose Keep editing, then use Save or Cancel in each edited section before making a copy."
            : "Reload the saved version or keep your edits in a separate resume."}
        </Dialog.Description>
        <button
          type="button"
          disabled={busy}
          onClick={onReload}
          className="flex items-center gap-3 rounded-lg border border-line p-3 text-left hover:bg-canvas disabled:opacity-60"
        >
          <LuRefreshCw
            aria-hidden="true"
            className="size-5 shrink-0 text-accent"
          />
          <span className="flex flex-1 flex-col gap-1">
            <span className="text-sm font-semibold">
              Reload latest saved version
            </span>
            <span className="text-xs text-muted">
              Discard the edits in this tab.
            </span>
          </span>
          <LuChevronRight aria-hidden="true" className="size-4 shrink-0" />
        </button>
        <button
          type="button"
          disabled={busy || hasSectionDrafts}
          onClick={() => void saveCopy()}
          className="flex items-center gap-3 rounded-lg border border-accent/25 bg-accent-soft p-3 text-left hover:border-accent disabled:opacity-60"
        >
          <LuCopy aria-hidden="true" className="size-5 shrink-0 text-accent" />
          <span className="flex flex-1 flex-col gap-1">
            <span className="text-sm font-semibold">
              {busy
                ? "Saving a separate resume…"
                : "Keep my edits as a separate resume"}
            </span>
            <span className="text-xs text-muted">
              Create a new draft from the edits in this tab.
            </span>
          </span>
          <LuChevronRight aria-hidden="true" className="size-4 shrink-0" />
        </button>
        {error && <InlineAlert>{error}</InlineAlert>}
        <Dialog.Close asChild>
          <button
            ref={keepEditing}
            type="button"
            disabled={busy}
            className="mt-2 min-h-11 self-end rounded-lg border border-line px-3 text-sm font-semibold hover:bg-canvas disabled:opacity-60"
          >
            Keep editing
          </button>
        </Dialog.Close>
      </DialogFrame>
    </Dialog.Root>
  );
};

export { ResumeConflictDialog };
