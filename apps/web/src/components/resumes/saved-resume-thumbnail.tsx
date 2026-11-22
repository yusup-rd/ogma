import { useQuery } from "@tanstack/react-query";
import { thumbnailQuery } from "@/lib/queries/resume-queries";
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
  const [visible, setVisible] = useState(false);
  const thumbnail = useQuery({
    ...thumbnailQuery(id, revision),
    enabled: visible,
  });
  const html = thumbnail.data;
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const frame = useRef<HTMLIFrameElement>(null);
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = container.current;
    if (!node) return;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      setVisible(true);
    });
    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={container}
      aria-hidden="true"
      data-thumbnail-state={thumbnail.isError ? "error" : phase}
      className={`relative w-54 max-w-[78%] ${paper === "Letter" ? "aspect-[8.5/11]" : "aspect-[210/297]"}`}
    >
      {(phase === "error" || thumbnail.isError) && (
        <span className="absolute inset-x-0 top-8 text-center text-xs text-muted">
          Preview unavailable
        </span>
      )}
      <div
        className="resume-thumbnail-paper absolute inset-0 overflow-hidden rounded-t-sm bg-paper shadow-lg"
        data-ready={phase === "ready"}
      >
        {html && (
          <iframe
            ref={frame}
            title="Saved resume thumbnail"
            srcDoc={html}
            sandbox="allow-same-origin"
            referrerPolicy="no-referrer"
            tabIndex={-1}
            className="pointer-events-none absolute inset-0 size-full border-0"
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
              if (
                node.isConnected &&
                frame.current === node &&
                node.contentDocument === doc
              )
                setPhase(doc.querySelector(".resume-page") ? "ready" : "error");
            }}
          />
        )}
      </div>
    </div>
  );
};
