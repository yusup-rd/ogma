import type { ReactNode } from "react";
import {
  DropdownSelect,
  type DropdownSelectOption,
} from "@/components/ui/dropdown-select";

const DefaultTag = () => {
  return (
    <span className="min-w-0 truncate rounded-sm bg-canvas px-1.5 py-0.5 text-[10px] font-medium text-muted">
      Default
    </span>
  );
};

interface SelectSettingProps<Value extends string | number> {
  label: string;
  accessibleLabel?: string;
  value: Value;
  defaultValue?: Value;
  options: readonly (readonly [Value, string])[];
  renderPreview?: (value: Value) => ReactNode;
  onChange: (value: Value) => void;
}

export const SelectSetting = <Value extends string | number>({
  label,
  accessibleLabel,
  value,
  defaultValue,
  options,
  renderPreview,
  onChange,
}: SelectSettingProps<Value>) => {
  const dropdownOptions: DropdownSelectOption[] = options.map(
    ([id, title]) => ({
      value: `option:${id}`,
      label: title,
      prefix: renderPreview?.(id),
      suffix: id === defaultValue ? <DefaultTag /> : undefined,
    }),
  );

  return (
    <div className="flex min-w-0 flex-col gap-1 text-xs font-semibold">
      <span>{label}</span>
      <DropdownSelect
        ariaLabel={accessibleLabel ?? label}
        value={`option:${value}`}
        options={dropdownOptions}
        onValueChange={(next) => {
          const option = options.find(([id]) => `option:${id}` === next);
          if (option) onChange(option[0]);
        }}
      />
    </div>
  );
};
