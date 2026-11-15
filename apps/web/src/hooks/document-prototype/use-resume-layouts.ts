"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  defaultSectionOrder,
  sectionKey,
  visibleResume,
  type EditorSectionId,
} from "@/lib/document-prototype/content-presentation";
import {
  defaultStyle,
  type DraftContent,
  type ResumeDraft,
  type TemplateCatalog,
  type TemplateOption,
  type TemplateStyle,
} from "@/lib/document-prototype/resume-layout-model";

export function useResumeLayouts() {
  const [catalog, setCatalog] = useState<TemplateCatalog | null>(null);
  const [editedContent, setContent] = useState<DraftContent | null>(null);
  const [template, setTemplate] = useState<TemplateOption | null>(null);
  const [settings, setSettings] = useState<Record<string, TemplateStyle>>({});
  const [photo, setPhoto] = useState<string>();
  const [logo, setLogo] = useState<string>();
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());
  const [customOrder, setOrder] = useState<EditorSectionId[]>();
  const [preview, setPreview] = useState<{
    html: string;
    pages: number;
    paper: "A4" | "Letter";
    templateName?: string;
  }>();
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const request = new AbortController();
    fetch("/api/resume-layouts", { signal: request.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Catalog unavailable");
        const next: TemplateCatalog = await response.json();
        if (request.signal.aborted) return;
        setCatalog(next);
        setTemplate(
          next.layouts.find((layout) => layout.id === "classic") ??
            next.layouts[0],
        );
      })
      .catch(() => {
        if (!request.signal.aborted)
          setError("Couldn’t load the template gallery. Is the API running?");
      });
    return () => request.abort();
  }, [reload]);

  const content = editedContent ?? catalog?.sample ?? null;
  const order = customOrder ?? defaultSectionOrder(template);
  const style = useMemo(
    () => (template ? (settings[template.id] ?? defaultStyle(template)) : null),
    [template, settings],
  );
  const exportDraft = useMemo<ResumeDraft | null>(
    () =>
      template && content && style
        ? {
            layoutId: template.id,
            sectionOrder: customOrder?.filter(
              (section) => section !== "personal",
            ),
            content: visibleResume(content, hidden),
            style: {
              ...style,
              showPhoto: style.showPhoto && !hidden.has(sectionKey("personal")),
            },
            photo,
            logo,
          }
        : null,
    [template, customOrder, content, hidden, style, photo, logo],
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
  }, [exportDraft]);

  const updateStyle = (changes: Partial<TemplateStyle>) => {
    if (!template) return;
    setSettings((current) => ({
      ...current,
      [template.id]: {
        ...(current[template.id] ?? defaultStyle(template)),
        ...changes,
      },
    }));
  };

  return {
    catalog,
    content,
    template,
    style,
    exportDraft,
    preview,
    error,
    order,
    hidden,
    logo,
    photo,
    setContent,
    setTemplate,
    setPhoto,
    setLogo,
    setOrder,
    updateStyle,
    toggleVisibility: (key: string) =>
      setHidden((previous) => {
        const next = new Set(previous);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      }),
    resetStyle: () => {
      if (template)
        setSettings((current) => ({
          ...current,
          [template.id]: defaultStyle(template),
        }));
    },
    retry: () => {
      setError("");
      if (catalog) setSettings((current) => ({ ...current }));
      else setReload((value) => value + 1);
    },
  };
}
