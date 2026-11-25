import * as Dialog from "@radix-ui/react-dialog";
import { LuLockKeyhole, LuLockKeyholeOpen } from "react-icons/lu";
import { DialogFrame } from "@/components/ui/dialog-frame";
import { InlineAlert } from "@/components/ui/inline-alert";

interface ResumeLockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locked: boolean;
  changed: boolean;
  hasSectionDrafts: boolean;
  busy: boolean;
  error: string;
  leaving: boolean;
  onConfirm: () => void;
  onDiscard: () => void;
}

export const ResumeLockDialog = ({
  open,
  onOpenChange,
  locked,
  changed,
  hasSectionDrafts,
  busy,
  error,
  leaving,
  onConfirm,
  onDiscard,
}: ResumeLockDialogProps) => {
  const Icon = locked ? LuLockKeyholeOpen : LuLockKeyhole;
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!busy) onOpenChange(next);
      }}
    >
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label={locked ? "Unlock CV" : "Lock CV"}
          className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-line px-2 text-xs font-semibold text-accent hover:bg-accent-soft active:bg-accent-soft sm:px-3"
        >
          <Icon aria-hidden="true" className="size-4" />
          <span className="hidden sm:inline">{locked ? "Unlock" : "Lock"}</span>
        </button>
      </Dialog.Trigger>
      <DialogFrame size="lg">
        <Dialog.Title className="text-xl font-semibold">
          {locked
            ? changed
              ? "Keep these preview changes?"
              : "Unlock this CV?"
            : "Lock this CV?"}
        </Dialog.Title>
        <Dialog.Description className="text-sm text-muted">
          {locked
            ? "The saved CV is protected. Unlocking enables autosave and saves your applied preview changes. Discarding restores the saved CV and keeps it locked."
            : "Save the current CV and protect it from accidental changes. You can still try templates, design settings and content while it is locked."}
        </Dialog.Description>
        {hasSectionDrafts && (
          <p role="status" className="rounded-lg bg-canvas p-3 text-sm">
            {locked
              ? "Apply each edited section to the preview or Cancel it before unlocking."
              : "Choose Save or Cancel in each edited section before locking."}
          </p>
        )}
        {error && <InlineAlert>{error}</InlineAlert>}
        <div className="flex flex-wrap justify-end gap-2">
          <Dialog.Close asChild>
            <button
              type="button"
              disabled={busy}
              className="min-h-11 rounded-lg border border-line px-3 text-sm font-semibold hover:bg-canvas disabled:opacity-60"
            >
              {locked ? "Keep previewing" : "Cancel"}
            </button>
          </Dialog.Close>
          {locked && changed && (
            <button
              type="button"
              disabled={busy}
              onClick={onDiscard}
              className="min-h-11 rounded-lg border border-line px-3 text-sm font-semibold hover:bg-canvas disabled:opacity-60"
            >
              {leaving
                ? "Discard preview and leave"
                : "Discard preview changes"}
            </button>
          )}
          <button
            type="button"
            disabled={busy || hasSectionDrafts}
            onClick={onConfirm}
            className="min-h-11 rounded-lg bg-accent px-3 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
          >
            {busy
              ? "Please wait…"
              : locked
                ? changed
                  ? leaving
                    ? "Unlock, save and leave"
                    : "Unlock and save"
                  : "Unlock CV"
                : "Lock CV"}
          </button>
        </div>
      </DialogFrame>
    </Dialog.Root>
  );
};
