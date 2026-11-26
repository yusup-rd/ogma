import { toast } from "sonner";
import { InlineAlert } from "@/components/ui/inline-alert";
import type { PhotoCrop } from "@ogma/contracts/resume-content-schema";
import { PhotoCropDialog } from "./photo-crop-dialog";
import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import {
  LuBuilding2,
  LuCrop,
  LuImage,
  LuTrash2,
  LuUpload,
} from "react-icons/lu";

interface ResumeImageUploadProps {
  kind: "photo" | "logo";
  value?: string;
  crop?: PhotoCrop;
  onChange: (value?: string, crop?: PhotoCrop) => void;
  onBusyChange?: (busy: boolean) => void;
}

async function prepareImage(file: File, kind: ResumeImageUploadProps["kind"]) {
  const isLogo = kind === "logo";
  const limit = isLogo ? 5 : 8;
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    file.size > limit * 1_000_000
  ) {
    throw new Error("Choose a PNG, JPEG, or WebP up to " + limit + " MB.");
  }
  const picture = await createImageBitmap(file);
  try {
    if (picture.width * picture.height > 24_000_000)
      throw new Error("Choose an image under 24 megapixels.");
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Couldn’t prepare the image.");
    const budget = isLogo ? 20_000 : 180_000;
    const sizes = isLogo ? [160, 128, 96, 64, 40] : [1024, 768, 512, 384];
    for (const size of sizes) {
      const scale = Math.min(1, size / Math.max(picture.width, picture.height));
      canvas.width = Math.max(1, Math.round(picture.width * scale));
      canvas.height = Math.max(1, Math.round(picture.height * scale));
      context.drawImage(picture, 0, 0, canvas.width, canvas.height);
      const webp = canvas.toDataURL("image/webp", isLogo ? 0.9 : 0.84);
      const optimized =
        !isLogo && !webp.startsWith("data:image/webp")
          ? canvas.toDataURL("image/jpeg", 0.82)
          : webp;
      if (optimized.startsWith("data:image/") && optimized.length <= budget)
        return optimized;
    }
    throw new Error(
      "This image is too large after optimization. Choose a smaller image.",
    );
  } finally {
    picture.close();
  }
}

const ResumeImageUpload = ({
  kind,
  value,
  crop,
  onChange,
  onBusyChange,
}: ResumeImageUploadProps) => {
  const input = useRef<HTMLInputElement>(null);
  const returnFocus = useRef<HTMLButtonElement>(null);
  const editButton = useRef<HTMLButtonElement>(null);
  const [editing, setEditing] = useState<{
    source: string;
    initial?: PhotoCrop;
    fromEdit?: boolean;
  }>();
  const request = useRef<AbortController>(null);
  const id = useId();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isLogo = kind === "logo";
  const label = isLogo ? "Employer logo" : "Profile photo";
  const Placeholder = isLogo ? LuBuilding2 : LuImage;
  useEffect(() => () => request.current?.abort(), []);

  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-xs font-semibold">{label}</h4>
      <div className="flex min-w-0 flex-wrap items-center gap-3 rounded-lg border border-line bg-canvas p-2.5">
        <div className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-md border border-line bg-paper text-muted">
          {value ? (
            <Image
              src={value}
              unoptimized
              alt=""
              width={36}
              height={36}
              className="size-full object-cover"
            />
          ) : (
            <Placeholder aria-hidden="true" className="size-4.5" />
          )}
        </div>
        <div className="min-w-32 flex-1">
          <p className="text-xs font-semibold">
            {busy
              ? "Preparing image…"
              : value
                ? "Image added"
                : "PNG, JPEG, or WebP"}
          </p>
          <p id={id} className="mt-0.5 text-xs text-muted">
            {isLogo
              ? "Up to 5 MB. Shown on templates with logos."
              : "Up to 8 MB. Shown on templates with a photo."}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <input
            ref={input}
            type="file"
            hidden
            aria-label={label}
            accept="image/png,image/jpeg,image/webp"
            onChange={async (event) => {
              const file = event.currentTarget.files?.[0];
              event.currentTarget.value = "";
              if (!file) return;
              request.current?.abort();
              const upload = new AbortController();
              request.current = upload;
              setError("");
              setBusy(true);
              onBusyChange?.(true);
              try {
                const image = await prepareImage(file, kind);
                if (!upload.signal.aborted) {
                  if (isLogo) {
                    onChange(image);
                    toast.success("Employer logo updated.", {
                      id: "image-updated",
                    });
                  } else setEditing({ source: image });
                }
              } catch (error) {
                if (upload.signal.aborted) return;
                setError(
                  error instanceof Error
                    ? error.message
                    : "Couldn’t open the image.",
                );
              } finally {
                if (!upload.signal.aborted) {
                  setBusy(false);
                  onBusyChange?.(false);
                }
              }
            }}
          />
          <button
            type="button"
            ref={returnFocus}
            disabled={busy}
            onClick={() => input.current?.click()}
            aria-describedby={id}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-line bg-paper px-2.5 text-xs font-semibold hover:border-accent/40 active:bg-accent-soft disabled:opacity-60"
          >
            <LuUpload aria-hidden="true" className="size-3.5" />
            {value ? "Replace" : isLogo ? "Add logo" : "Add photo"}
          </button>
          {!isLogo && value && (
            <button
              type="button"
              ref={editButton}
              disabled={busy}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 text-xs font-semibold hover:bg-paper"
              onClick={() =>
                setEditing({
                  source: crop?.source ?? value,
                  initial: crop,
                  fromEdit: true,
                })
              }
            >
              <LuCrop aria-hidden="true" className="size-3.5" />
              Crop
            </button>
          )}
          {value && (
            <button
              type="button"
              disabled={busy}
              aria-label={`Remove ${label.toLowerCase()}`}
              onClick={() => {
                setError("");
                onChange(undefined);
                toast.success(label + " removed.", { id: "image-updated" });
              }}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-muted hover:bg-paper disabled:opacity-60"
            >
              <LuTrash2 aria-hidden="true" className="size-3.5" />
              Remove
            </button>
          )}
        </div>
      </div>
      {editing && (
        <PhotoCropDialog
          source={editing.source}
          initial={editing.initial}
          returnFocus={editing.fromEdit ? editButton : returnFocus}
          onCancel={() => setEditing(undefined)}
          onApply={(photo, crop) => {
            onChange(photo, crop);
            toast.success("Photo crop updated.", { id: "image-updated" });
            setEditing(undefined);
          }}
        />
      )}
      {error && <InlineAlert className="text-xs">{error}</InlineAlert>}
    </div>
  );
};

export { ResumeImageUpload };
