import { useRef, useState } from "react";
import { LuArrowDown, LuChevronLeft, LuLayoutGrid } from "react-icons/lu";
import type { TemplateOption } from "@/lib/document-prototype/resume-layout-model";
import { TemplateSkeleton } from "./template-skeleton";

interface TemplateGalleryProps {
  templates: TemplateOption[];
  active: string;
  onSelect: (template: TemplateOption) => void;
}

const filters = [
  "All",
  "Single column",
  "Double column",
  "Photo",
  "Logos",
] as const;
type Filter = (typeof filters)[number];

function matches(template: TemplateOption, filter: Filter) {
  switch (filter) {
    case "Single column":
      return template.side.length === 0;
    case "Double column":
      return template.side.length > 0;
    case "Photo":
      return template.photo !== "none";
    case "Logos":
      return template.logos !== "none";
    default:
      return true;
  }
}

const cardClass =
  "grid min-h-42 min-w-0 content-start gap-2 rounded-xl border border-line bg-canvas px-2.5 py-3 text-center";
const nameClass =
  "min-w-0 truncate text-xs leading-snug font-semibold text-ink";

const TemplateGallery = ({
  templates,
  active,
  onSelect,
}: TemplateGalleryProps) => {
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState<Filter>("All");
  const expandButton = useRef<HTMLButtonElement>(null);
  const selected = templates.find((template) => template.id === active);
  const available = templates.filter(
    (template) => template.id !== active && matches(template, filter),
  );
  if (!selected) return null;
  const visible = [selected, ...available];
  const close = () => {
    setExpanded(false);
    setFilter("All");
    requestAnimationFrame(() => expandButton.current?.focus());
  };

  return (
    <section
      aria-labelledby="gallery-heading"
      className="@container/picker flex min-w-0 flex-col gap-3"
    >
      <div className="flex min-h-8 items-center justify-between gap-2">
        <h3 id="gallery-heading" className="text-base font-semibold">
          Templates
        </h3>
        {expanded && (
          <button
            type="button"
            onClick={close}
            className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-accent hover:bg-accent-soft"
          >
            <LuChevronLeft aria-hidden="true" className="size-4" /> Back to
            selected
          </button>
        )}
      </div>
      {expanded ? (
        <>
          <div className="flex flex-wrap gap-1.5" aria-label="Filter templates">
            {filters.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
                className="min-h-9 rounded-md border border-line px-2.5 text-xs font-semibold text-muted aria-pressed:border-accent/25 aria-pressed:bg-accent-soft aria-pressed:text-accent"
              >
                {value}
              </button>
            ))}
          </div>
          <div className="grid auto-rows-max grid-cols-2 gap-2.5 @min-[25rem]/picker:grid-cols-3">
            {visible.map((template) => (
              <button
                key={template.id}
                type="button"
                aria-pressed={template.id === active}
                title={template.name}
                className={`${cardClass} hover:border-accent/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:bg-accent-soft aria-pressed:border-accent aria-pressed:bg-accent-soft`}
                onClick={() => {
                  onSelect(template);
                  close();
                }}
              >
                <TemplateSkeleton template={template} />
                <span className={nameClass}>{template.name}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 @min-[25rem]/picker:grid-cols-3">
          <div
            className={`${cardClass} border-accent bg-accent-soft`}
            title={selected.name}
          >
            <TemplateSkeleton template={selected} />
            <span className={nameClass}>{selected.name}</span>
          </div>
          <button
            ref={expandButton}
            type="button"
            onClick={() => setExpanded(true)}
            className="flex min-w-0 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-canvas p-3 text-center text-xs font-semibold text-accent hover:border-accent/45 hover:bg-accent-soft active:bg-accent-soft"
          >
            <LuLayoutGrid aria-hidden="true" className="size-5" />
            See all templates
            <LuArrowDown aria-hidden="true" className="size-3.5" />
          </button>
        </div>
      )}
    </section>
  );
};

export { TemplateGallery };
