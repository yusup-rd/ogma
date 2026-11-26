"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { DialogFrame } from "@/components/ui/dialog-frame";
import { InlineAlert } from "@/components/ui/inline-alert";
import Image from "next/image";
import { useRef, useState, type RefObject } from "react";
import type { PhotoCrop } from "@ogma/contracts/resume-content-schema";

interface PhotoCropDialogProps {
  source: string;
  initial?: PhotoCrop;
  returnFocus: RefObject<HTMLButtonElement | null>;
  onCancel: () => void;
  onApply: (photo: string, crop: PhotoCrop) => void;
}

const center = { x: 0, y: 0, zoom: 1 };
const arrows: Record<string, readonly [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};
const bound = (value: number, extent: number) =>
  Math.max((1 - extent) / 2, Math.min((extent - 1) / 2, value));

const PhotoCropDialog = ({
  source,
  initial,
  returnFocus,
  onCancel,
  onApply,
}: PhotoCropDialogProps) => {
  const [crop, setCrop] = useState(initial ?? center);
  const [ratio, setRatio] = useState(1);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const image = useRef<HTMLImageElement>(null);
  const grip = useRef<{ id: number; x: number; y: number } | null>(null);
  const width = Math.max(1, ratio) * crop.zoom;
  const height = Math.max(1, 1 / ratio) * crop.zoom;
  const x = bound(crop.x, width);
  const y = bound(crop.y, height);
  const move = (dx: number, dy: number) =>
    setCrop((current) => ({
      ...current,
      x: bound(current.x + dx, Math.max(1, ratio) * current.zoom),
      y: bound(current.y + dy, Math.max(1, 1 / ratio) * current.zoom),
    }));

  const apply = () => {
    if (!ready || !image.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 320;
    const context = canvas.getContext("2d");
    if (!context) {
      setFailed(true);
      return;
    }
    context.fillStyle = "#fff";
    context.fillRect(0, 0, 320, 320);
    context.drawImage(
      image.current,
      (0.5 + x - width / 2) * 320,
      (0.5 + y - height / 2) * 320,
      width * 320,
      height * 320,
    );
    const webp = canvas.toDataURL("image/webp", 0.84);
    const result = webp.startsWith("data:image/webp;base64,")
      ? webp
      : canvas.toDataURL("image/jpeg", 0.82);
    if (result.length > 180_000) {
      setFailed(true);
      return;
    }
    onApply(result, { source, x, y, zoom: crop.zoom });
  };

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <DialogFrame
        size="md"
        responsivePadding={false}
        strongBackdrop
        contentClassName="text-ink"
        contentProps={{
          onCloseAutoFocus: (event) => {
            event.preventDefault();
            requestAnimationFrame(() => returnFocus.current?.focus());
          },
        }}
      >
        <header>
          <Dialog.Title className="text-xl font-semibold tracking-tight">
            Crop profile photo
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-muted">
            Drag the photo or use the arrow keys to position it. Use Zoom to
            adjust the framing.
          </Dialog.Description>
        </header>
        <div
          tabIndex={0}
          role="group"
          aria-label="Photo position"
          className="relative mx-auto aspect-square w-full max-w-72 shrink-0 cursor-grab touch-none overflow-hidden rounded-xl bg-paper active:cursor-grabbing"
          onKeyDown={(event) => {
            const direction = arrows[event.key];
            if (!ready || !direction) return;
            event.preventDefault();
            const step = event.shiftKey ? 0.06 : 0.015;
            move(direction[0] * step, direction[1] * step);
          }}
          onPointerDown={(event) => {
            if (!ready || !event.isPrimary || event.button !== 0) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            grip.current = {
              id: event.pointerId,
              x: event.clientX,
              y: event.clientY,
            };
          }}
          onPointerMove={(event) => {
            const previous = grip.current;
            if (previous?.id !== event.pointerId) return;
            const size = event.currentTarget.clientWidth;
            move(
              (event.clientX - previous.x) / size,
              (event.clientY - previous.y) / size,
            );
            grip.current = {
              id: event.pointerId,
              x: event.clientX,
              y: event.clientY,
            };
          }}
          onLostPointerCapture={() => {
            grip.current = null;
          }}
        >
          <Image
            ref={image}
            src={source}
            alt=""
            width={320}
            height={320}
            unoptimized
            draggable={false}
            onLoad={(event) => {
              setRatio(
                event.currentTarget.naturalWidth /
                  event.currentTarget.naturalHeight,
              );
              setReady(true);
            }}
            onError={() => setFailed(true)}
            className="pointer-events-none absolute max-w-none -translate-x-1/2 -translate-y-1/2 select-none"
            style={{
              visibility: ready ? "visible" : "hidden",
              left: (0.5 + x) * 100 + "%",
              top: (0.5 + y) * 100 + "%",
              width: width * 100 + "%",
              height: height * 100 + "%",
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 [&_span]:border-white/45"
          >
            <span className="col-start-2 row-span-3 row-start-1 border-x" />
            <span className="col-span-3 col-start-1 row-start-2 border-y" />
          </div>
        </div>
        <label className="flex items-center gap-3 text-sm font-medium">
          Zoom
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={crop.zoom}
            disabled={!ready}
            className="min-h-11 min-w-0 flex-1 accent-accent"
            aria-valuetext={Math.round(crop.zoom * 100) + "%"}
            onChange={(event) => {
              const zoom = Number(event.currentTarget.value);
              setCrop({
                x: bound(x, Math.max(1, ratio) * zoom),
                y: bound(y, Math.max(1, 1 / ratio) * zoom),
                zoom,
              });
            }}
          />
          <span
            aria-hidden="true"
            className="w-11 text-right text-xs text-muted tabular-nums"
          >
            {Math.round(crop.zoom * 100)}%
          </span>
        </label>
        {failed && (
          <InlineAlert>
            Couldn’t prepare this crop. Try a different photo.
          </InlineAlert>
        )}
        <footer className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setCrop(center)}
            className="mr-auto min-h-11 rounded-lg px-2 text-sm font-semibold text-muted hover:bg-canvas"
          >
            Reset
          </button>
          <Dialog.Close asChild>
            <button
              type="button"
              className="min-h-11 rounded-lg border border-line px-3 text-sm font-semibold hover:bg-canvas"
            >
              Cancel
            </button>
          </Dialog.Close>
          <button
            type="button"
            disabled={!ready}
            onClick={apply}
            className="min-h-11 rounded-lg bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-hover active:brightness-90 disabled:opacity-60"
          >
            Apply crop
          </button>
        </footer>
      </DialogFrame>
    </Dialog.Root>
  );
};
export { PhotoCropDialog };
