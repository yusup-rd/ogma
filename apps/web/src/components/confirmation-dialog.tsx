"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useState, type ReactElement } from "react";
import { DialogFrame } from "@/components/ui/dialog-frame";
import { InlineAlert } from "@/components/ui/inline-alert";

interface ConfirmationDialogProps {
  trigger: ReactElement;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  action: () => void | Promise<void>;
}

const ConfirmationDialog = ({
  trigger,
  title,
  description,
  confirmLabel,
  destructive = false,
  action,
}: ConfirmationDialogProps) => {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState({
    title,
    description,
    confirmLabel,
    destructive,
    action,
  });

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        if (next)
          setConfirmation({
            title,
            description,
            confirmLabel,
            destructive,
            action,
          });
        setOpen(next);
        setError("");
      }}
    >
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <DialogFrame size="sm" gap={3} responsivePadding={false}>
        <Dialog.Title className="text-lg font-semibold tracking-tight">
          {confirmation.title}
        </Dialog.Title>
        <Dialog.Description className="text-sm leading-relaxed text-muted">
          {confirmation.description}
        </Dialog.Description>
        {error && <InlineAlert>{error}</InlineAlert>}
        <form
          className="mt-1 flex flex-wrap justify-end gap-2"
          onSubmit={async (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (pending) return;
            setPending(true);
            setError("");
            try {
              await confirmation.action();
              setOpen(false);
            } catch (error) {
              setError(
                error instanceof Error
                  ? error.message
                  : "Couldn’t complete this action. Try again.",
              );
            } finally {
              setPending(false);
            }
          }}
        >
          <Dialog.Close asChild>
            <button
              type="button"
              disabled={pending}
              className="min-h-11 rounded-lg border border-line px-3 text-sm font-semibold hover:bg-canvas"
            >
              Cancel
            </button>
          </Dialog.Close>
          <button
            type="submit"
            disabled={pending}
            className={`min-h-11 rounded-lg px-3 text-sm font-semibold text-white disabled:opacity-60 ${confirmation.destructive ? "bg-red-700 hover:bg-red-800" : "bg-accent hover:bg-accent-hover"}`}
          >
            {confirmation.confirmLabel}
          </button>
        </form>
      </DialogFrame>
    </Dialog.Root>
  );
};

export { ConfirmationDialog };
