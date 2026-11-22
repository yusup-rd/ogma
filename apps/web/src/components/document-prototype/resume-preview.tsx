import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { LuEye, LuMinus, LuPlus } from "react-icons/lu";
import { formatPageCount, formatPercent } from "@/lib/formatUtil";

interface ResumePreviewProps {
  html?: string;
  pages?: number;
  paper: "A4" | "Letter";
  templateName?: string;
  mobileVisible: boolean;
  hasUnsavedChanges: boolean;
}

const buttonClass =
  "grid min-h-9 min-w-9 place-items-center rounded-lg px-2 text-xs font-semibold text-muted hover:bg-paper active:bg-accent-soft disabled:opacity-35";
const minZoom = 0.5;
const maxZoom = 2;
const zoomKey = "ogma.preview.zoom";
const zoomStep = 0.25;

const previewShell = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:">
<style id="ogma-preview-styles"></style></head><body></body></html>`;

function readingPosition(doc: Document) {
  const scroll = doc.scrollingElement;
  const top = scroll?.scrollTop ?? 0;
  const left = scroll?.scrollLeft ?? 0;
  if (top < 1) return { top, left };
  const entries = Array.from(
    doc.querySelectorAll<HTMLElement>("[data-preview-anchor]"),
  );
  const visible = entries
    .map((entry) => ({ entry, box: entry.getBoundingClientRect() }))
    .filter(
      ({ box }) =>
        box.bottom > 0 &&
        box.right > 0 &&
        box.left < doc.documentElement.clientWidth,
    );
  const nearby = visible.filter(
    ({ entry, box }) =>
      !entry.dataset.previewAnchor?.startsWith("section:") &&
      box.top < 80 &&
      box.bottom >= Math.min(24, box.height),
  );
  const [anchor] = (nearby.length ? nearby : visible).sort(
    (a, b) =>
      Math.max(0, a.box.top) - Math.max(0, b.box.top) ||
      a.box.height - b.box.height,
  );
  if (!anchor) return { top, left };
  return {
    top,
    left,
    key: anchor.entry.dataset.previewAnchor,
    offset:
      anchor.box.top <= 0
        ? -anchor.box.top / Math.max(1, anchor.box.height)
        : undefined,
    before: Math.max(0, anchor.box.top),
  };
}

function paintPreview(
  frame: HTMLIFrameElement | null,
  html: string,
  zoom: number,
  previousHtml: { current?: string },
) {
  const doc = frame?.contentDocument;
  const styles = doc?.getElementById("ogma-preview-styles");
  if (!doc || !styles || !doc.body) return;
  const scroll = readingPosition(doc);
  doc.documentElement.style.setProperty("--preview-zoom", String(zoom));
  if (previousHtml.current === html && doc.body.firstElementChild) return;

  const source = new DOMParser().parseFromString(html, "text/html");
  styles.textContent = Array.from(
    source.head.querySelectorAll("style"),
    (style) => style.textContent,
  ).join("\n");
  doc.title = source.title;
  doc.body.replaceChildren(
    ...Array.from(source.body.childNodes, (node) => doc.importNode(node, true)),
  );
  previousHtml.current = html;
  const viewport = doc.scrollingElement;
  if (!viewport) return;
  // A reflow can move the visible entry to another page. Keep the entry in view.
  const anchors = Array.from(
    doc.querySelectorAll<HTMLElement>("[data-preview-anchor]"),
  )
    .filter((node) => node.dataset.previewAnchor === scroll.key)
    .map((node) => node.getBoundingClientRect())
    .sort(
      (a, b) =>
        Math.abs(a.top + viewport.scrollTop - scroll.top) -
        Math.abs(b.top + viewport.scrollTop - scroll.top),
    );
  const anchor = anchors[0];
  viewport.scrollLeft = scroll.left;
  viewport.scrollTop = anchor
    ? viewport.scrollTop +
      anchor.top +
      (scroll.offset ?? 0) * anchor.height -
      (scroll.before ?? 0)
    : scroll.top;
}

const ResumePreview = ({
  html,
  pages,
  paper,
  templateName,
  mobileVisible,
  hasUnsavedChanges,
}: ResumePreviewProps) => {
  const [zoom, setZoom] = useState(1);
  useEffect(() => {
    const restore = requestAnimationFrame(() => {
      try {
        const saved = Number(localStorage.getItem(zoomKey));
        if (saved >= minZoom && saved <= maxZoom) setZoom(saved);
      } catch {
        /* Storage may be unavailable. */
      }
    });
    return () => cancelAnimationFrame(restore);
  }, []);

  const changeZoom = (value: number) => {
    setZoom(value);
    try {
      localStorage.setItem(zoomKey, String(value));
    } catch {
      /* The current view still works. */
    }
  };
  const frame = useRef<HTMLIFrameElement>(null);
  const renderedHtml = useRef<string | undefined>(undefined);
  useLayoutEffect(() => {
    if (!html) return;
    const syncDevicePixel = () => {
      const doc = frame.current?.contentDocument;
      const ratio = doc?.defaultView?.devicePixelRatio ?? 1;
      doc?.documentElement.style.setProperty(
        "--preview-device-pixel",
        `${1 / ratio}px`,
      );
    };
    syncDevicePixel();
    paintPreview(frame.current, html, zoom, renderedHtml);
    window.addEventListener("resize", syncDevicePixel);
    return () => window.removeEventListener("resize", syncDevicePixel);
  }, [html, zoom]);
  const hasPreview = html !== undefined;

  return (
    <section
      aria-label="Resume document preview"
      className={`${mobileVisible ? "flex" : "hidden"} h-[calc(100dvh-8rem)] min-h-0 min-w-0 flex-col gap-3 bg-preview p-3 lg:flex lg:h-auto lg:px-8 lg:pt-5`}
    >
      <div className="flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-line bg-canvas px-2 sm:px-3.5">
        <LuEye
          aria-hidden="true"
          className="hidden size-4 shrink-0 text-muted sm:block"
        />
        <h2 className="text-sm font-semibold">Preview</h2>
        <p
          aria-live="polite"
          className="min-w-0 flex-1 text-xs leading-snug text-muted sm:ml-3"
          title={templateName}
        >
          {paper}
          {pages !== undefined ? ` · ${formatPageCount(pages)}` : ""}
          {templateName ? ` · ${templateName}` : ""}
        </p>
        <div
          role="group"
          aria-label="Preview zoom"
          className="ml-auto flex shrink-0 items-center gap-0.5"
        >
          <button
            type="button"
            aria-label="Zoom out"
            title="Zoom out"
            className={buttonClass}
            disabled={!hasPreview || zoom <= minZoom}
            onClick={() => changeZoom(Math.max(minZoom, zoom - zoomStep))}
          >
            <LuMinus aria-hidden="true" className="size-3.5" />
          </button>
          <button
            type="button"
            aria-label="Fit to preview"
            title="Fit to preview"
            aria-pressed={zoom === 1}
            disabled={!hasPreview}
            className={
              buttonClass +
              " min-w-12 aria-pressed:bg-accent-soft aria-pressed:text-accent"
            }
            onClick={() => changeZoom(1)}
          >
            {zoom === 1 ? "Fit" : formatPercent(zoom)}
          </button>
          <button
            type="button"
            aria-label="Zoom in"
            title="Zoom in"
            className={buttonClass}
            disabled={!hasPreview || zoom >= maxZoom}
            onClick={() => changeZoom(Math.min(maxZoom, zoom + zoomStep))}
          >
            <LuPlus aria-hidden="true" className="size-3.5" />
          </button>
        </div>
      </div>
      {hasUnsavedChanges && (
        <p role="status" className="shrink-0 px-1 text-xs text-accent">
          Previewing unsaved edits · Save each edited section to keep them.
        </p>
      )}
      {hasPreview && (
        <iframe
          ref={frame}
          className="min-h-0 w-full flex-1 border-0"
          sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          srcDoc={previewShell}
          title="Resume preview"
          onLoad={() => {
            if (html) paintPreview(frame.current, html, zoom, renderedHtml);
          }}
        />
      )}
    </section>
  );
};

export { ResumePreview };
