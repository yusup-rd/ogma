"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useState, type ReactElement } from "react";

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

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        setOpen(next);
        setError("");
      }}
    >
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/35" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 flex-col gap-3 overflow-auto rounded-2xl border border-line bg-paper p-5 shadow-xl">
          <Dialog.Title className="text-lg font-semibold tracking-tight">
            {title}
          </Dialog.Title>
          <Dialog.Description className="text-sm leading-relaxed text-muted">
            {description}
          </Dialog.Description>
          {error && (
            <p role="alert" className="text-sm text-red-800">
              {error}
            </p>
          )}
          <form
            className="mt-1 flex flex-wrap justify-end gap-2"
            onSubmit={async (event) => {
              event.preventDefault();
              if (pending) return;
              setPending(true);
              setError("");
              try {
                await action();
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
              className={`min-h-11 rounded-lg px-3 text-sm font-semibold text-white disabled:opacity-60 ${destructive ? "bg-red-700 hover:bg-red-800" : "bg-accent hover:bg-accent-hover"}`}
            >
              {confirmLabel}
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export { ConfirmationDialog };
