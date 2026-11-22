import { useEffect, useRef, useState } from "react";

interface SavedResumeThumbnailProps {
  id: string;
  revision: number;
  paper: "A4" | "Letter";
}

export const SavedResumeThumbnail = ({
  id,
  revision,
  paper,
}: SavedResumeThumbnailProps) => {
  const [html, setHtml] = useState<string>();
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const request = new AbortController();
    const signal = AbortSignal.any([
      request.signal,
      AbortSignal.timeout(25000),
    ]);
    void fetch(`/api/resumes/${id}/thumbnail?revision=${revision}`, {
      signal,
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Thumbnail unavailable");
        const html = await response.text();
        if (
          !new DOMParser()
            .parseFromString(html, "text/html")
            .querySelector(".workspace .resume-page")
        )
          throw new Error("Invalid thumbnail");
        if (!request.signal.aborted) setHtml(html);
      })
      .catch(() => {
        if (!request.signal.aborted) setPhase("error");
      });
    return () => request.abort();
  }, [id, revision]);

  return (
    <div
      aria-hidden="true"
      data-thumbnail-state={phase}
      className={`relative w-54 max-w-[78%] overflow-hidden rounded-t-sm bg-paper shadow-lg ${paper === "Letter" ? "aspect-[8.5/11]" : "aspect-[210/297]"}`}
    >
      {phase !== "ready" && (
        <div className="absolute inset-0 flex flex-col gap-3 p-4">
          <div className="h-2 w-2/3 rounded-sm bg-accent/25" />
          <div className="h-1 w-1/2 rounded-sm bg-line" />
          <div className="grid flex-1 grid-cols-[2fr_1fr] gap-3 pt-2">
            {[0, 1].map((column) => (
              <div key={column} className="flex flex-col gap-4">
                {[0, 1, 2].map((section) => (
                  <div key={section} className="flex flex-col gap-1.5">
                    <div className="h-1 w-3/4 rounded-sm bg-accent/20" />
                    <div className="h-1 rounded-sm bg-line" />
                    <div className="h-1 w-4/5 rounded-sm bg-line" />
                    <div className="h-1 w-2/3 rounded-sm bg-line" />
                  </div>
                ))}
              </div>
            ))}
          </div>
          {phase === "error" && (
            <span className="text-center text-xs text-muted">
              Preview unavailable
            </span>
          )}
        </div>
      )}
      {html && (
        <iframe
          ref={frame}
          title="Saved resume thumbnail"
          srcDoc={html}
          sandbox="allow-same-origin"
          referrerPolicy="no-referrer"
          tabIndex={-1}
          className={`pointer-events-none absolute inset-0 size-full border-0 ${phase === "ready" ? "visible" : "invisible"}`}
          onLoad={async () => {
            const node = frame.current;
            const doc = node?.contentDocument;
            if (!node || !doc) return;
            await doc.fonts.ready;
            await Promise.all(
              Array.from(doc.images, (image) =>
                image.decode().catch(() => undefined),
              ),
            );
            if (node.isConnected && frame.current === node)
              setPhase(doc.querySelector(".resume-page") ? "ready" : "error");
          }}
        />
      )}
    </div>
  );
};
