import Link, { type LinkProps } from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export type ActionButtonVariant = "primary" | "secondary";

const variants: Record<ActionButtonVariant, string> = {
  primary:
    "bg-accent px-4 text-white hover:bg-accent-hover active:bg-accent-hover disabled:opacity-60",
  secondary:
    "border border-line bg-paper px-3 hover:bg-canvas active:bg-accent-soft disabled:opacity-60",
};

const actionButtonClass = (variant: ActionButtonVariant, className?: string) =>
  twMerge(
    "pressable-action inline-flex min-h-11 items-center justify-center gap-2 rounded-lg text-sm font-semibold",
    variants[variant],
    className,
  );

interface ActionButtonProps extends ComponentProps<"button"> {
  variant?: ActionButtonVariant;
}

const ActionButton = ({
  variant = "secondary",
  className,
  ...props
}: ActionButtonProps) => {
  return (
    <button {...props} className={actionButtonClass(variant, className)} />
  );
};

interface ActionLinkProps extends LinkProps {
  variant?: ActionButtonVariant;
  className?: string;
  children: ReactNode;
}

const ActionLink = ({
  variant = "secondary",
  className,
  children,
  ...props
}: ActionLinkProps) => {
  return (
    <Link {...props} className={actionButtonClass(variant, className)}>
      {children}
    </Link>
  );
};

export { ActionButton, ActionLink };
