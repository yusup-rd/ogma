import type { ImportReview } from "@ogma/contracts/resume-import";
import {
  LuChevronDown,
  LuCircleAlert,
  LuFileCheck2,
  LuFileText,
  LuLink,
} from "react-icons/lu";
import { formatPageCount } from "@/lib/formatUtil";

interface ImportSourcePanelProps {
  fileName: string;
  review: ImportReview;
}

const ImportSourcePanel = ({ fileName, review }: ImportSourcePanelProps) => {
  return (
    <aside
      aria-label="Import source"
      className="order-1 flex min-w-0 flex-col gap-4 xl:sticky xl:top-6 xl:order-2"
    >
      <div className="overflow-hidden rounded-2xl border border-line bg-paper">
        <div className="flex items-center gap-3 p-4">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
            <LuFileCheck2 aria-hidden="true" className="size-5" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold" title={fileName}>
              {fileName}
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              {review.pageCount
                ? formatPageCount(review.pageCount) + " · "
                : ""}
              Ready to review
            </p>
          </div>
        </div>
        <details className="group border-t border-line">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-medium">
            <span className="inline-flex items-center gap-2">
              <LuFileText aria-hidden="true" className="size-4 text-muted" />
              Extracted text
            </span>
            <LuChevronDown
              aria-hidden="true"
              className="size-4 text-muted transition-transform duration-150 group-open:rotate-180 motion-reduce:transition-none"
            />
          </summary>
          <div className="max-h-96 overflow-auto border-t border-line px-4 py-3 text-sm leading-relaxed wrap-anywhere whitespace-pre-wrap">
            {review.text || "No selectable text found."}
          </div>
        </details>
        {review.links.length > 0 && (
          <details className="group border-t border-line">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-medium">
              <span className="inline-flex items-center gap-2">
                <LuLink aria-hidden="true" className="size-4 text-muted" />
                Link destinations
              </span>
              <LuChevronDown
                aria-hidden="true"
                className="size-4 text-muted transition-transform duration-150 group-open:rotate-180 motion-reduce:transition-none"
              />
            </summary>
            <ul className="flex max-h-80 flex-col gap-4 overflow-auto border-t border-line p-4 text-sm">
              {review.links.map((link, index) => (
                <li
                  key={`${link.url}:${index}`}
                  className="flex flex-col gap-1 wrap-anywhere"
                >
                  <span className="font-medium">{link.label || "Link"}</span>
                  <span className="text-xs leading-relaxed text-muted">
                    {link.url}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
      {review.unmapped && (
        <details
          open
          className="overflow-hidden rounded-2xl border border-accent/20 bg-paper"
        >
          <summary className="flex min-h-12 cursor-pointer items-center gap-2 px-4 text-sm font-semibold text-accent">
            <LuCircleAlert aria-hidden="true" className="size-4 shrink-0" />
            Needs your attention
          </summary>
          <div className="flex flex-col gap-3 border-t border-line p-4">
            <p className="text-sm text-muted">
              Place this text in the right section.
            </p>
            <div className="max-h-80 overflow-auto text-sm leading-relaxed wrap-anywhere whitespace-pre-wrap">
              {review.unmapped}
            </div>
          </div>
        </details>
      )}
    </aside>
  );
};

export { ImportSourcePanel };
