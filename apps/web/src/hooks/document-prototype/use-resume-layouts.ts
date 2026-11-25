"use client";
import { useQuery } from "@tanstack/react-query";
import { catalogQuery } from "@/lib/queries/resume-queries";
import { toast } from "sonner";

import type { PhotoCrop } from "@ogma/contracts/resume-content-schema";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ResumeDocument } from "@ogma/contracts/resume-workspace";
import {
  defaultStyle,
  resolveResume,
  resolveStyle,
} from "@ogma/contracts/resolve-resume";
import type { SectionPreview } from "@/lib/document-prototype/content-preview";
import {
  defaultSectionOrder,
  type EditorSectionId,
} from "@/lib/document-prototype/content-presentation";
import {
  type DraftContent,
  type ResumeDraft,
  type TemplateOption,
  type TemplateStyle,
} from "@/lib/document-prototype/resume-layout-model";

import { pruneLibrarySources } from "@/lib/content-library/resume-library";

function renameSection(
  document: ResumeDocument,
  section: Exclude<EditorSectionId, "personal">,
  title: string,
) {
  const sectionTitles = { ...document.sectionTitles };
  if (title.trim()) sectionTitles[section] = title.trim();
  else delete sectionTitles[section];
  const settings = Object.fromEntries(
    Object.entries(document.settings).map(([id, style]) => {
      if (style.sectionOverrides?.[section]?.title === undefined)
        return [id, style];
      const sectionOverrides = { ...style.sectionOverrides };
      const override = { ...sectionOverrides[section] };
      delete override.title;
      sectionOverrides[section] = override;
      return [id, { ...style, sectionOverrides }];
    }),
  );
  return { ...document, sectionTitles, settings };
}

export function useResumeLayouts(initialDocument: ResumeDocument) {
  const catalogResult = useQuery(catalogQuery());
  const catalog = catalogResult.data ?? null;
  const [editedDocument, setEditedDocument] = useState<ResumeDocument>();
  const [sectionPreviews, setSectionPreviews] = useState<
    Partial<Record<EditorSectionId, SectionPreview>>
  >({});
  const onPreviewChange = useCallback(
    (section: EditorSectionId, preview?: SectionPreview) => {
      setSectionPreviews((current) => {
        if (current[section] === preview) return current;
        const next = { ...current };
        if (preview) next[section] = preview;
        else delete next[section];
        return next;
      });
    },
    [],
  );
  const [preview, setPreview] = useState<{
    html: string;
    pages: number;
    paper: "A4" | "Letter";
    templateName?: string;
  }>();
  const [error, setError] = useState("");
  const [previewRetry, setPreviewRetry] = useState(0);

  const document = editedDocument ?? initialDocument;
  const { content, photo, sectionOrder: customOrder } = document;
  const hidden = useMemo(() => new Set(document.hidden), [document.hidden]);
  const template =
    catalog?.layouts.find(({ id }) => id === document.layoutId) ?? null;
  const order = useMemo(
    () => customOrder ?? defaultSectionOrder(template),
    [customOrder, template],
  );
  const style = useMemo(
    () => (template ? resolveStyle(document, template) : null),
    [template, document],
  );
  const previewDraft = useMemo<ResumeDraft | null>(() => {
    if (!template) return null;
    let previewDocument = document;
    for (const section of order) {
      const preview = sectionPreviews[section];
      if (!preview) continue;
      const { content, ...assets } = preview;
      previewDocument = {
        ...previewDocument,
        ...assets,
        content: { ...previewDocument.content, ...content },
      };
    }
    return resolveResume(previewDocument, template);
  }, [template, document, order, sectionPreviews]);
  const exportDraft = useMemo<ResumeDraft | null>(
    () => (template ? resolveResume(document, template) : null),
    [template, document],
  );

  const previewQueue = useRef<{
    pending?: ResumeDraft;
    running?: AbortController;
  }>({});
  useEffect(() => {
    const queue = previewQueue.current;
    return () => {
      queue.running?.abort();
      queue.running = undefined;
      queue.pending = undefined;
    };
  }, []);

  useEffect(() => {
    if (!previewDraft) return;
    const queue = previewQueue.current;
    queue.pending = previewDraft;
    if (queue.running) return;

    // A slider can outpace pagination. Render the newest pending value next.
    const request = new AbortController();
    queue.running = request;
    void (async () => {
      try {
        while (!request.signal.aborted && queue.pending) {
          const draft = queue.pending;
          queue.pending = undefined;
          try {
            const response = await fetch("/api/resume-layouts/preview", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(draft),
              signal: request.signal,
            });
            if (!response.ok) throw new Error("Preview failed");
            const html = await response.text();
            const pending = previewQueue.current.pending;
            if (request.signal.aborted || pending) continue;
            const marker = new DOMParser()
              .parseFromString(html, "text/html")
              .querySelector(".workspace");
            setPreview({
              html,
              pages: Number(marker?.getAttribute("data-page-count")) || 1,
              paper: draft.style.paperSize === "letter" ? "Letter" : "A4",
              templateName:
                marker?.getAttribute("data-template-name") ?? undefined,
            });
            setError("");
          } catch {
            if (!request.signal.aborted && !queue.pending)
              setError(
                "Couldn’t update the preview. Check the fields and try again.",
              );
          }
        }
      } finally {
        if (queue.running === request) queue.running = undefined;
      }
    })();
  }, [previewDraft, previewRetry]);

  const setDocument = useCallback(
    (update: (current: ResumeDocument) => ResumeDocument) => {
      setEditedDocument((current) => update(current ?? initialDocument));
    },
    [initialDocument],
  );
  const setSectionTitle = useCallback(
    (section: Exclude<EditorSectionId, "personal">, title: string) =>
      setDocument((current) => renameSection(current, section, title)),
    [setDocument],
  );
  const toggleVisibility = useCallback(
    (key: string) =>
      setDocument((current) => {
        const next = new Set(current.hidden);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return { ...current, hidden: [...next] };
      }),
    [setDocument],
  );
  const sectionOverrides = style?.sectionOverrides;
  const sectionTitles = useMemo(
    () =>
      sectionOverrides &&
      Object.fromEntries(
        Object.entries(sectionOverrides)
          .filter(([, value]) => value?.title)
          .map(([id, value]) => [id, value?.title]),
      ),
    [sectionOverrides],
  );

  const updateStyle = (changes: Partial<TemplateStyle>) => {
    if (!template) return;
    setDocument((current) => {
      let next: ResumeDocument = {
        ...current,
        settings: {
          ...current.settings,
          [template.id]: {
            ...(current.settings[template.id] ?? defaultStyle(template)),
            ...changes,
          },
        },
      };
      if (changes.sectionOverrides) {
        const previous = resolveStyle(current, template).sectionOverrides;
        for (const section of order) {
          if (section === "personal") continue;
          const title = changes.sectionOverrides[section]?.title;
          if (title !== previous?.[section]?.title)
            next = renameSection(next, section, title ?? "");
        }
      }
      return next;
    });
  };

  return {
    document,
    catalog,
    content,
    template,
    style,
    exportDraft,
    preview,
    error:
      error ||
      (catalogResult.isError
        ? "Couldn’t load the template gallery. Try again."
        : ""),
    order,
    hidden,
    photo,
    onPreviewChange,
    sectionTitles,
    setSectionTitle,
    setDocument,
    setContent: (content: DraftContent) =>
      setDocument((current) => pruneLibrarySources({ ...current, content })),
    setTemplate: (selected: TemplateOption) =>
      setDocument((current) =>
        current.layoutId === selected.id
          ? current
          : {
              ...current,
              layoutId: selected.id,
              settings: Object.fromEntries(
                Object.entries(current.settings).filter(([id]) =>
                  catalog?.layouts.some((layout) => layout.id === id),
                ),
              ),
            },
      ),
    setPhoto: (photo?: string, photoCrop?: PhotoCrop) =>
      setDocument((current) => ({ ...current, photo, photoCrop })),
    setOrder: (sectionOrder: EditorSectionId[]) =>
      setDocument((current) => ({ ...current, sectionOrder })),
    updateStyle,
    toggleVisibility,
    resetStyle: () => {
      if (template) {
        toast.success("Template design reset.", { id: "design-reset" });
        setDocument((current) => ({
          ...current,
          settings: {
            ...current.settings,
            [template.id]: defaultStyle(template),
          },
        }));
      }
    },
    retry: () => {
      setError("");
      if (catalogResult.isError || !catalog) void catalogResult.refetch();
      else setPreviewRetry((value) => value + 1);
    },
  };
}
