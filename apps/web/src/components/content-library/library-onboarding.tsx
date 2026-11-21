"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { LuPlus, LuX } from "react-icons/lu";

interface LibraryOnboardingProps {
  open: boolean;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onNewResume: () => void;
  onStartBlank: () => void;
}

const LibraryOnboarding = ({
  open,
  busy,
  onOpenChange,
  onNewResume,
  onStartBlank,
}: LibraryOnboardingProps) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
          disabled={busy}
          onClick={(event) => {
            event.preventDefault();
            onNewResume();
          }}
        >
          <LuPlus aria-hidden="true" className="size-4" />
          New resume
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/35" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col gap-3 rounded-2xl border border-line bg-paper p-5 text-ink shadow-xl">
          <div className="flex items-start justify-between gap-3">
            <Dialog.Title className="text-lg font-semibold tracking-tight">
              Start with your Library?
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Dismiss"
                className="-mt-2 -mr-2 grid size-10 shrink-0 place-items-center rounded-lg text-muted hover:bg-canvas"
              >
                <LuX aria-hidden="true" className="size-4" />
              </button>
            </Dialog.Close>
          </div>
          <Dialog.Description className="text-sm leading-relaxed text-muted">
            Add one detail, such as your name, a job, or a skill, to reuse it in
            future resumes. You can also start with a blank resume.
          </Dialog.Description>
          <div className="mt-2 flex flex-wrap justify-end gap-2">
            <Dialog.Close asChild>
              <button
                type="button"
                className="min-h-11 rounded-lg border border-line px-3 text-sm font-semibold hover:bg-canvas"
                onClick={onStartBlank}
              >
                Start blank
              </button>
            </Dialog.Close>
            <Link
              href="/library?from=new-resume"
              className="inline-flex min-h-11 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-hover"
            >
              Go to Library
            </Link>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export { LibraryOnboarding };
