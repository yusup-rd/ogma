import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { LuSettings2, LuX } from "react-icons/lu";
import type { SectionStyle } from "@ogma/contracts/resume-workspace";
import type { ResumeSectionId } from "../../../../../packages/contracts/resume-content";
import type { TemplateStyle } from "@/lib/document-prototype/resume-layout-model";
import { sectionTitles } from "@/lib/document-prototype/content-presentation";

interface SectionSettingsProps {
  section: ResumeSectionId;
  style: TemplateStyle;
  onChange: (changes: Partial<TemplateStyle>) => void;
}

const numericFields = [
  { key: "headingSize", label: "Heading size (pt)", min: 5, max: 60 },
  {
    key: "letterSpacing",
    label: "Heading letter spacing (pt)",
    min: -1,
    max: 5,
  },
  { key: "bulletSpacing", label: "Bullet spacing (mm)", min: 0, max: 15 },
  { key: "sectionGap", label: "Section gap (mm)", min: 0, max: 20 },
  { key: "lineHeight", label: "Body line height", min: 0.9, max: 2.5 },
] as const;
const fieldClass =
  "min-h-11 w-full rounded-lg border border-line bg-paper px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export const SectionSettings = ({
  section,
  style,
  onChange,
}: SectionSettingsProps) => {
  const [open, setOpen] = useState(false);
  const [resetCount, setResetCount] = useState(0);
  const override =
    resetCount > 0 ? undefined : style.sectionOverrides?.[section];
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        setResetCount(0);
      }}
    >
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-line px-3 text-left text-sm hover:bg-canvas active:bg-accent-soft"
        >
          <span className="min-w-0 wrap-anywhere">
            {style.sectionOverrides?.[section]?.title ?? sectionTitles[section]}
          </span>
          <LuSettings2
            aria-hidden="true"
            className="size-4 shrink-0 text-muted"
          />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/35" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-auto rounded-2xl border border-line bg-paper p-5 shadow-xl sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <Dialog.Title className="text-xl font-semibold">
              Section settings
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close section settings"
                className="grid size-9 place-items-center rounded-lg hover:bg-canvas active:bg-accent-soft"
              >
                <LuX aria-hidden="true" />
              </button>
            </Dialog.Close>
          </div>
          <Dialog.Description className="text-sm text-muted">
            Customize {sectionTitles[section].toLowerCase()}. Empty fields
            follow the current template settings. Section titles apply across
            this CV’s templates.
          </Dialog.Description>
          <form
            key={resetCount}
            className="flex flex-col gap-5"
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              const next: SectionStyle = {};
              const title = String(data.get("title") ?? "").trim();
              if (title) next.title = title;
              for (const field of numericFields) {
                const value = data.get(field.key);
                if (typeof value === "string" && value.trim())
                  next[field.key] = Number(value);
              }
              const weight = Number(data.get("headingWeight"));
              if (
                weight === 200 ||
                weight === 300 ||
                weight === 400 ||
                weight === 600 ||
                weight === 700
              )
                next.headingWeight = weight;
              if (data.has("breakBefore")) next.breakBefore = true;
              const overrides = { ...style.sectionOverrides };
              if (Object.keys(next).length) overrides[section] = next;
              else delete overrides[section];
              onChange({ sectionOverrides: overrides });
              setOpen(false);
              setResetCount(0);
            }}
          >
            <label className="flex flex-col gap-2 text-xs font-semibold">
              Section title
              <input
                name="title"
                maxLength={120}
                defaultValue={override?.title ?? ""}
                placeholder="Template title"
                className={fieldClass}
              />
            </label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {numericFields.map((field) => (
                <label
                  key={field.key}
                  className="flex flex-col gap-2 text-xs font-semibold"
                >
                  {field.label}
                  <input
                    type="number"
                    name={field.key}
                    min={field.min}
                    max={field.max}
                    step="any"
                    inputMode="decimal"
                    defaultValue={override?.[field.key] ?? ""}
                    placeholder="Inherit"
                    className={fieldClass}
                  />
                </label>
              ))}
              <label className="flex flex-col gap-2 text-xs font-semibold">
                Heading weight
                <select
                  name="headingWeight"
                  defaultValue={override?.headingWeight ?? ""}
                  className={fieldClass}
                >
                  <option value="">Inherit</option>
                  <option value="200">Extra light</option>
                  <option value="300">Light</option>
                  <option value="400">Regular</option>
                  <option value="600">Semibold</option>
                  <option value="700">Bold</option>
                </select>
              </label>
            </div>
            <label className="flex min-h-11 items-center gap-3 text-sm">
              <input
                type="checkbox"
                name="breakBefore"
                defaultChecked={override?.breakBefore ?? false}
                className="size-4 accent-accent"
              />
              Start this section on a new page
            </label>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setResetCount((count) => count + 1)}
                className="min-h-11 rounded-lg px-3 text-sm font-semibold hover:bg-canvas active:bg-accent-soft"
              >
                Reset overrides
              </button>
              <button
                type="submit"
                className="min-h-11 rounded-lg bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-hover active:opacity-80"
              >
                Apply settings
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
