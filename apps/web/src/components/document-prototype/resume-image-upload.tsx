import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { LuBuilding2, LuImage, LuUpload } from "react-icons/lu";

interface ResumeImageUploadProps {
  kind: "photo" | "logo";
  value?: string;
  onChange: (value?: string) => void;
}

async function prepareImage(file: File, kind: ResumeImageUploadProps["kind"]) {
  if (
    !["image/png", "image/jpeg"].includes(file.type) ||
    file.size > 8_000_000
  ) {
    throw new Error("Choose a PNG or JPEG smaller than 8 MB.");
  }
  const picture = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Couldn’t prepare the image.");
    if (kind === "logo") {
      let size = 128;
      for (;;) {
        const scale = Math.min(
          1,
          size / Math.max(picture.width, picture.height),
        );
        canvas.width = Math.max(1, Math.round(picture.width * scale));
        canvas.height = Math.max(1, Math.round(picture.height * scale));
        context.drawImage(picture, 0, 0, canvas.width, canvas.height);
        const logo = canvas.toDataURL("image/png");
        if (logo.length <= 20_000) return logo;
        size = Math.floor(size * 0.75);
      }
    }
    const crop = Math.min(picture.width, picture.height);
    canvas.width = canvas.height = Math.min(320, crop);
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(
      picture,
      (picture.width - crop) / 2,
      (picture.height - crop) / 2,
      crop,
      crop,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    return canvas.toDataURL("image/jpeg", 0.82);
  } finally {
    picture.close();
  }
}

const ResumeImageUpload = ({
  kind,
  value,
  onChange,
}: ResumeImageUploadProps) => {
  const input = useRef<HTMLInputElement>(null);
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
              className={`size-9 ${isLogo ? "object-contain" : "rounded-sm object-cover"}`}
            />
          ) : (
            <Placeholder aria-hidden="true" className="size-4.5" />
          )}
        </div>
        <div className="min-w-32 flex-1">
          <p className="text-xs font-semibold">
            {busy ? "Preparing image…" : value ? "Image added" : "PNG or JPEG"}
          </p>
          <p id={id} className="mt-0.5 text-xs text-muted">
            {isLogo
              ? "Appears beside this position on templates with logos."
              : "Appears on the first page."}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <input
            ref={input}
            type="file"
            hidden
            aria-label={label}
            accept="image/png,image/jpeg"
            onChange={async (event) => {
              const file = event.currentTarget.files?.[0];
              event.currentTarget.value = "";
              if (!file) return;
              request.current?.abort();
              const upload = new AbortController();
              request.current = upload;
              setError("");
              setBusy(true);
              try {
                const image = await prepareImage(file, kind);
                if (!upload.signal.aborted) onChange(image);
              } catch (error) {
                if (upload.signal.aborted) return;
                setError(
                  error instanceof Error
                    ? error.message
                    : "Couldn’t open the image.",
                );
              } finally {
                if (!upload.signal.aborted) setBusy(false);
              }
            }}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => input.current?.click()}
            aria-describedby={id}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-line bg-paper px-2.5 text-xs font-semibold hover:border-accent/40 active:bg-accent-soft disabled:opacity-60"
          >
            <LuUpload aria-hidden="true" className="size-3.5" />
            {value ? "Replace" : isLogo ? "Add logo" : "Add photo"}
          </button>
          {value && (
            <button
              type="button"
              disabled={busy}
              aria-label={`Remove ${label.toLowerCase()}`}
              onClick={() => {
                setError("");
                onChange(undefined);
              }}
              className="min-h-9 rounded-md px-2 text-xs font-semibold text-muted hover:bg-paper disabled:opacity-60"
            >
              Remove
            </button>
          )}
        </div>
      </div>
      {error && (
        <p role="alert" className="text-xs text-red-800">
          {error}
        </p>
      )}
    </div>
  );
};

export { ResumeImageUpload };
