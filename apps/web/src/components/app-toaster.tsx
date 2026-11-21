"use client";

import { useEffect, type CSSProperties } from "react";
import { Toaster, toast } from "sonner";
import {
  LuCircleCheck,
  LuCircleAlert,
  LuInfo,
  LuTriangleAlert,
} from "react-icons/lu";
import { takeArrivalNotification } from "@/lib/notifications/navigation";

const AppToaster = () => {
  useEffect(() => {
    const message = takeArrivalNotification();
    if (message) toast.success(message);
  }, []);

  return (
    <Toaster
      theme="light"
      position="bottom-right"
      closeButton
      duration={4000}
      visibleToasts={3}
      offset={{ bottom: "max(24px, env(safe-area-inset-bottom))", right: 24 }}
      mobileOffset={{
        bottom: "max(16px, env(safe-area-inset-bottom))",
        left: 16,
        right: 16,
      }}
      style={
        {
          "--normal-bg": "var(--color-paper)",
          "--normal-text": "var(--color-ink)",
          "--normal-border": "var(--color-line)",
          "--border-radius": "12px",
          "--font-family": "var(--font-sans)",
          zIndex: 100,
        } as CSSProperties
      }
      icons={{
        success: <LuCircleCheck className="size-5 text-accent" />,
        error: <LuCircleAlert className="size-5 text-red-700" />,
        info: <LuInfo className="size-5 text-accent" />,
        warning: <LuTriangleAlert className="size-5 text-amber-700" />,
      }}
      toastOptions={{
        classNames: {
          toast: "ogma-toast",
          title: "font-semibold",
          description: "text-muted!",
          closeButton: "ogma-toast-close",
        },
      }}
    />
  );
};

export { AppToaster };
