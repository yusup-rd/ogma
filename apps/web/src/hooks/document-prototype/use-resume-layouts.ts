"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ResumeDocument } from "@ogma/contracts/resume-workspace";
import { defaultStyle, resolveResume } from "@ogma/contracts/resolve-resume";
import {
  defaultSectionOrder,
  type EditorSectionId,
} from "@/lib/document-prototype/content-presentation";
import {
  templateCatalogSchema,
  type DraftContent,
  type ResumeDraft,
  type TemplateCatalog,
  type TemplateOption,
  type TemplateStyle,
} from "@/lib/document-prototype/resume-layout-model";

export function useResumeLayouts(initialDocument: ResumeDocument) {
  const [catalog, setCatalog] = useState<TemplateCatalog | null>(null);
  const [editedDocument, setEditedDocument] = useState<ResumeDocument>();
  const [preview, setPreview] = useState<{
    html: string;
    pages: number;
    paper: "A4" | "Letter";
    templateName?: string;
  }>();
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [previewRetry, setPreviewRetry] = useState(0);

  useEffect(() => {
    const request = new AbortController();
    fetch("/api/resume-layouts", { signal: request.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Catalog unavailable");
        const next: TemplateCatalog = templateCatalogSchema.parse(
          await response.json(),
        );
        if (request.signal.aborted) return;
        setCatalog(next);
      })
      .catch(() => {
        if (!request.signal.aborted)
          setError("Couldn’t load the template gallery. Is the API running?");
      });
    return () => request.abort();
  }, [reload]);

  const document = editedDocument ?? initialDocument;
  const { content, settings, photo, sectionOrder: customOrder } = document;
  const hidden = useMemo(() => new Set(document.hidden), [document.hidden]);
  const template =
    catalog?.layouts.find(({ id }) => id === document.layoutId) ?? null;
  const order = customOrder ?? defaultSectionOrder(template);
  const style = useMemo(
    () => (template ? (settings[template.id] ?? defaultStyle(template)) : null),
    [template, settings],
  );
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
    if (!exportDraft) return;
    const queue = previewQueue.current;
    queue.pending = exportDraft;
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
            if (
              request.signal.aborted ||
              (pending && pending.layoutId !== draft.layoutId)
            )
              continue;
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
  }, [exportDraft, previewRetry]);

  const setDocument = (update: (current: ResumeDocument) => ResumeDocument) => {
    setEditedDocument((current) => update(current ?? initialDocument));
  };

  const updateStyle = (changes: Partial<TemplateStyle>) => {
    if (!template) return;
    setDocument((current) => ({
      ...current,
      settings: {
        ...current.settings,
        [template.id]: {
          ...(current.settings[template.id] ?? defaultStyle(template)),
          ...changes,
        },
      },
    }));
  };

  return {
    document,
    catalog,
    content,
    template,
    style,
    exportDraft,
    preview,
    error,
    order,
    hidden,
    photo,
    setContent: (content: DraftContent) =>
      setDocument((current) => ({ ...current, content })),
    setTemplate: (selected: TemplateOption) =>
      setDocument((current) =>
        current.layoutId === selected.id
          ? current
          : { ...current, layoutId: selected.id },
      ),
    setPhoto: (photo: string | undefined) =>
      setDocument((current) => ({ ...current, photo })),
    setOrder: (sectionOrder: EditorSectionId[]) =>
      setDocument((current) => ({ ...current, sectionOrder })),
    updateStyle,
    toggleVisibility: (key: string) =>
      setDocument((current) => {
        const next = new Set(current.hidden);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return { ...current, hidden: [...next] };
      }),
    resetStyle: () => {
      if (template)
        setDocument((current) => ({
          ...current,
          settings: {
            ...current.settings,
            [template.id]: defaultStyle(template),
          },
        }));
    },
    retry: () => {
      setError("");
      if (catalog) setPreviewRetry((value) => value + 1);
      else setReload((value) => value + 1);
    },
  };
}
