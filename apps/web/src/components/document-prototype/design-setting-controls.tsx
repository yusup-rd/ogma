import { useState, type ReactNode } from "react";
import { fieldClass } from "@/components/ui/form-fields";

interface ToggleSettingProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const ToggleSetting = ({ label, checked, onChange }: ToggleSettingProps) => {
  return (
    <label className="col-span-2 flex min-h-9 cursor-pointer items-center gap-2 text-sm">
      <input
        type="checkbox"
        className="size-4 shrink-0"
        checked={checked}
        onChange={(event) => onChange(event.currentTarget.checked)}
      />
      {label}
    </label>
  );
};

interface NumberSettingProps {
  className?: string;
  label: string;
  value?: number;
  fallback: number;
  min: number;
  max: number;
  unit: string;
  inheritDefault?: boolean;
  onChange: (value?: number) => void;
}

const NumberSetting = ({
  className,
  label,
  value,
  fallback,
  min,
  max,
  unit,
  inheritDefault = true,
  onChange,
}: NumberSettingProps) => {
  const [typed, setTyped] = useState<string | null>(null);
  const effective = value ?? fallback;
  const update = (next: number) =>
    onChange(inheritDefault && next === fallback ? undefined : next);

  return (
    <div className={`flex min-w-0 flex-col gap-1 ${className ?? ""}`}>
      <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-semibold">
        {label}
        <span className="relative mt-auto">
          <input
            aria-label={label}
            type="number"
            min={min}
            max={max}
            step="any"
            inputMode="decimal"
            value={typed ?? String(effective)}
            className={`${fieldClass} [appearance:textfield] pr-9 [&::-webkit-inner-spin-button]:appearance-none`}
            onChange={(event) => setTyped(event.currentTarget.value)}
            onBlur={(event) => {
              const next = event.currentTarget.valueAsNumber;
              setTyped(null);
              if (!event.currentTarget.value) onChange(undefined);
              else if (Number.isFinite(next) && next !== effective)
                update(Math.max(min, Math.min(max, next)));
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
              if (event.key === "Escape") {
                event.currentTarget.value = String(effective);
                event.currentTarget.blur();
              }
            }}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-3 flex items-center font-normal text-muted"
          >
            {unit}
          </span>
        </span>
      </label>
      <input
        aria-label={label + " slider"}
        type="range"
        min={min}
        max={max}
        step={unit === "%" ? 1 : 0.1}
        value={effective}
        className="h-6 w-full min-w-0 cursor-pointer accent-accent"
        onChange={(event) => {
          setTyped(null);
          update(event.currentTarget.valueAsNumber);
        }}
      />
    </div>
  );
};

interface SettingsGroupProps {
  title: string;
  children: ReactNode;
}

const SettingsGroup = ({ title, children }: SettingsGroupProps) => {
  return (
    <fieldset className="grid min-w-0 grid-cols-2 gap-3 rounded-xl border border-line p-3.5">
      <legend className="px-1 text-sm font-semibold">{title}</legend>
      {children}
    </fieldset>
  );
};

export { NumberSetting, SettingsGroup, ToggleSetting };
