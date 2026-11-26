import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { LuPencil, LuX } from "react-icons/lu";
import { DialogFrame } from "@/components/ui/dialog-frame";
import {
  sectionTitles,
  type EditorSectionId,
} from "@/lib/document-prototype/content-presentation";

interface SectionTitleEditorProps {
  section: Exclude<EditorSectionId, "personal">;
  title: string;
  onRename: (
    section: Exclude<EditorSectionId, "personal">,
    title: string,
  ) => void;
}

export const SectionTitleEditor = ({
  section,
  title,
  onRename,
}: SectionTitleEditorProps) => {
  const [open, setOpen] = useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label={`Rename ${title}`}
          title="Rename section"
          className="mr-1 grid size-11 shrink-0 place-items-center rounded-lg text-muted hover:bg-canvas active:bg-accent-soft"
        >
          <LuPencil aria-hidden="true" className="size-4" />
        </button>
      </Dialog.Trigger>
      <DialogFrame size="md">
        <div className="flex items-center justify-between gap-3">
          <Dialog.Title className="text-xl font-semibold">
            Rename section
          </Dialog.Title>
          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Close rename section"
              className="grid size-11 shrink-0 place-items-center rounded-lg hover:bg-canvas active:bg-accent-soft"
            >
              <LuX aria-hidden="true" />
            </button>
          </Dialog.Close>
        </div>
        <Dialog.Description className="text-sm text-muted">
          Use any language. This title stays with this CV when you change
          templates. Leave it empty to use the template title.
        </Dialog.Description>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            const value = new FormData(event.currentTarget).get("title");
            onRename(section, typeof value === "string" ? value.trim() : "");
            setOpen(false);
          }}
        >
          <label className="flex flex-col gap-2 text-xs font-semibold">
            Section title
            <input
              name="title"
              maxLength={120}
              defaultValue={title}
              placeholder={sectionTitles[section]}
              className="min-h-11 w-full rounded-lg border border-line bg-paper px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            />
          </label>
          <div className="flex justify-end gap-2">
            <Dialog.Close asChild>
              <button
                type="button"
                className="min-h-11 rounded-lg border border-line px-3 text-sm font-semibold hover:bg-canvas active:bg-accent-soft"
              >
                Cancel
              </button>
            </Dialog.Close>
            <button
              type="submit"
              className="min-h-11 rounded-lg bg-accent px-3 text-sm font-semibold text-white hover:bg-accent-hover active:bg-accent-hover"
            >
              Save title
            </button>
          </div>
        </form>
      </DialogFrame>
    </Dialog.Root>
  );
};
