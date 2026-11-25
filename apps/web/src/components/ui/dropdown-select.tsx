"use client";

import { useState, type ReactNode } from "react";
import * as Select from "@radix-ui/react-select";
import { LuCheck, LuChevronDown } from "react-icons/lu";

export interface DropdownSelectOption {
  value: string;
  label: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  disabled?: boolean;
}

interface DropdownSelectProps {
  options: readonly DropdownSelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  name?: string;
  ariaLabel: string;
  placeholder?: string;
  disabled?: boolean;
  triggerClassName?: string;
}

const DropdownSelect = ({
  options,
  value,
  defaultValue = "",
  onValueChange,
  name,
  ariaLabel,
  placeholder,
  disabled = false,
  triggerClassName = "",
}: DropdownSelectProps) => {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const selectedValue = value ?? uncontrolledValue;
  const selectedOption = options.find(
    (option) => option.value === selectedValue,
  );

  return (
    <>
      {name && (
        <input
          type="hidden"
          name={name}
          value={selectedValue}
          disabled={disabled}
        />
      )}
      <Select.Root
        value={selectedOption ? `option:${selectedValue}` : ""}
        disabled={disabled}
        onValueChange={(next) => {
          const nextValue = next.slice("option:".length);
          setUncontrolledValue(nextValue);
          onValueChange?.(nextValue);
        }}
      >
        <Select.Trigger
          aria-label={ariaLabel}
          className={`group flex min-h-10 w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-lg border border-line bg-paper px-3 text-left text-sm font-normal focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent active:bg-canvas disabled:cursor-not-allowed disabled:opacity-50 data-[state=open]:border-accent/60 ${triggerClassName}`}
        >
          {selectedOption?.prefix && (
            <span
              aria-hidden="true"
              className="grid size-4 shrink-0 place-items-center"
            >
              {selectedOption.prefix}
            </span>
          )}
          <span className="min-w-0 flex-1 truncate">
            <Select.Value placeholder={placeholder} />
          </span>
          {selectedOption?.suffix}
          <LuChevronDown
            aria-hidden="true"
            className="size-4 shrink-0 text-muted transition-transform duration-150 group-data-[state=open]:rotate-180 motion-reduce:transition-none"
          />
        </Select.Trigger>
        <Select.Portal>
          <Select.Content
            position="popper"
            sideOffset={5}
            className="z-60 max-h-(--radix-select-content-available-height) max-w-[calc(100dvw-1.25rem)] min-w-(--radix-select-trigger-width) overflow-hidden rounded-xl border border-line bg-paper p-1 shadow-lg"
          >
            <Select.Viewport className="max-h-(--radix-select-content-available-height)">
              {options.map((option) => (
                <Select.Item
                  key={option.value}
                  value={`option:${option.value}`}
                  disabled={option.disabled}
                  className="flex min-h-9 cursor-pointer items-center justify-between gap-3 rounded-lg px-2.5 text-sm outline-none data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-accent-soft data-highlighted:text-accent"
                >
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    {option.prefix && (
                      <span
                        aria-hidden="true"
                        className="grid size-4 shrink-0 place-items-center"
                      >
                        {option.prefix}
                      </span>
                    )}
                    <Select.ItemText className="min-w-0 truncate">
                      {option.label}
                    </Select.ItemText>
                  </span>
                  <span className="flex max-w-[45%] min-w-0 items-center gap-1.5">
                    {option.suffix}
                    <Select.ItemIndicator className="grid size-4 shrink-0 place-items-center">
                      <LuCheck aria-hidden="true" className="size-4" />
                    </Select.ItemIndicator>
                  </span>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </>
  );
};

export { DropdownSelect };
