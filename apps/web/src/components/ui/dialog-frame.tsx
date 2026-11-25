import type { ComponentProps, ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { twMerge } from "tailwind-merge";

type DialogSize = "sm" | "md" | "lg" | "xl";
type DialogLayer = "standard" | "nested" | "top";
type DialogGap = 3 | 4 | 5;

interface DialogFrameProps {
  children: ReactNode;
  size: DialogSize;
  layer?: DialogLayer;
  gap?: DialogGap;
  scroll?: "both" | "vertical";
  responsivePadding?: boolean;
  strongBackdrop?: boolean;
  contentClassName?: string;
  overlayClassName?: string;
  contentProps?: Omit<
    ComponentProps<typeof Dialog.Content>,
    "children" | "className"
  >;
}

const layerClasses: Record<DialogLayer, { overlay: string; content: string }> =
  {
    standard: { overlay: "z-40", content: "z-50" },
    nested: { overlay: "z-20", content: "z-30" },
    top: { overlay: "z-50", content: "z-50" },
  };

const sizeClasses: Record<DialogSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

const gapClasses: Record<DialogGap, string> = {
  3: "gap-3",
  4: "gap-4",
  5: "gap-5",
};

const DialogFrame = ({
  children,
  size,
  layer = "standard",
  gap = 4,
  scroll = "both",
  responsivePadding = true,
  strongBackdrop = false,
  contentClassName,
  overlayClassName,
  contentProps,
}: DialogFrameProps) => {
  const layerClass = layerClasses[layer];
  return (
    <Dialog.Portal>
      <Dialog.Overlay
        className={twMerge(
          `fixed inset-0 ${layerClass.overlay} ${strongBackdrop ? "bg-ink/45" : "bg-ink/35"}`,
          overlayClassName,
        )}
      />
      <Dialog.Content
        {...contentProps}
        className={twMerge(
          `fixed top-1/2 left-1/2 ${layerClass.content} flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col ${gapClasses[gap]} ${scroll === "vertical" ? "overflow-y-auto" : "overflow-auto"} rounded-2xl border border-line bg-paper p-5 shadow-xl ${sizeClasses[size]} ${responsivePadding ? "sm:p-6" : ""}`,
          contentClassName,
        )}
      >
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  );
};

export { DialogFrame };
