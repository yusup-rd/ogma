import type { Ref } from "react";

export const fieldClass =
  "min-h-10 w-full min-w-0 rounded-lg border border-line bg-paper px-3 text-sm font-normal focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent";

export const inputClass = `${fieldClass} py-2 placeholder:text-muted disabled:bg-canvas disabled:text-muted`;

export interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "month" | "date" | "email" | "tel" | "search";
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  inputRef?: Ref<HTMLInputElement>;
  className?: string;
}

export const TextField = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled = false,
  maxLength = 240,
  inputRef,
  className = "",
}: TextFieldProps) => {
  return (
    <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold">
      {label}
      <input
        ref={inputRef}
        className={`${inputClass} ${className}`}
        type={type}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        maxLength={maxLength}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </label>
  );
};

interface TextareaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  maxLength?: number;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const TextareaField = ({
  label,
  value,
  onChange,
  rows = 4,
  maxLength,
  placeholder,
  disabled = false,
  className = "",
}: TextareaFieldProps) => {
  return (
    <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold">
      {label}
      <textarea
        className={`${inputClass} ${className}`}
        rows={rows}
        maxLength={maxLength}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </label>
  );
};
