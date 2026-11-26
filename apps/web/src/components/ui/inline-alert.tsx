import type { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

interface InlineAlertProps {
  children: ReactNode;
  className?: string;
}

const InlineAlert = ({ children, className = "" }: InlineAlertProps) => {
  return (
    <p role="alert" className={twMerge("text-sm text-red-800", className)}>
      {children}
    </p>
  );
};

export { InlineAlert };
