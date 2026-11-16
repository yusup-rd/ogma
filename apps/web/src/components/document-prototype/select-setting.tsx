import * as Select from "@radix-ui/react-select";
import { LuCheck, LuChevronDown } from "react-icons/lu";

const fieldClass =
  "min-h-10 w-full min-w-0 rounded-lg border border-line bg-paper px-3 text-sm font-normal focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent";
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
  onChange: (value: Value) => void;
}

export const SelectSetting = <Value extends string | number>({
  label,
  accessibleLabel,
  value,
  defaultValue,
  options,
  onChange,
}: SelectSettingProps<Value>) => {
  return (
    <div className="flex min-w-0 flex-col gap-1 text-xs font-semibold">
      <span>{label}</span>
      <Select.Root
        value={`option:${value}`}
        onValueChange={(next) => {
          const option = options.find(([id]) => `option:${id}` === next);
          if (option) onChange(option[0]);
        }}
      >
        <Select.Trigger
          aria-label={accessibleLabel ?? label}
          className={`${fieldClass} flex items-center justify-between gap-1 text-left active:bg-canvas data-[state=open]:border-accent/60`}
        >
          <span className="min-w-0 flex-1 truncate">
            <Select.Value />
          </span>
          {value === defaultValue && <DefaultTag />}
          <LuChevronDown
            aria-hidden="true"
            className="size-4 shrink-0 text-muted"
          />
        </Select.Trigger>
        <Select.Portal>
          <Select.Content
            position="popper"
            sideOffset={5}
            className="z-40 max-h-[var(--radix-select-content-available-height)] max-w-[calc(100dvw-1.25rem)] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-line bg-paper p-1 shadow-lg"
          >
            <Select.Viewport className="max-h-[var(--radix-select-content-available-height)]">
              {options.map(([id, title]) => (
                <Select.Item
                  key={id}
                  value={`option:${id}`}
                  className="flex min-h-9 cursor-default items-center justify-between gap-3 rounded-lg px-2.5 text-sm outline-none data-highlighted:bg-accent-soft data-highlighted:text-accent"
                >
                  <Select.ItemText className="min-w-0 truncate">
                    {title}
                  </Select.ItemText>
                  <span className="flex max-w-[45%] min-w-0 items-center gap-1.5">
                    {id === defaultValue && <DefaultTag />}
                    <span className="size-4 shrink-0">
                      <Select.ItemIndicator>
                        <LuCheck aria-hidden="true" className="size-4" />
                      </Select.ItemIndicator>
                    </span>
                  </span>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );
};
