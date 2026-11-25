import { templateHeaderPadding } from "@ogma/contracts/resolve-resume";
import type {
  TemplateOption,
  TemplateStyle,
} from "@/lib/document-prototype/resume-layout-model";
import { NumberSetting, SettingsGroup } from "../design-setting-controls";
import { SelectSetting } from "../select-setting";
import {
  spacingRoles,
  textRoles,
  weightOptions,
} from "./design-setting-options";

interface AdvancedDesignSettingsProps {
  template: TemplateOption;
  style: TemplateStyle;
  onChange: (changes: Partial<TemplateStyle>) => void;
}

const AdvancedDesignSettings = ({
  template,
  style,
  onChange,
}: AdvancedDesignSettingsProps) => {
  const defaults = template.designDefaults;
  const headerPadding = templateHeaderPadding(style, template);

  return (
    <>
      <SettingsGroup title="Text sizes">
        {textRoles.map(([role, label]) => (
          <NumberSetting
            key={role}
            label={label}
            value={
              role === "body"
                ? style.bodySize === template.bodySize
                  ? undefined
                  : style.bodySize
                : style.sizes?.[role]
            }
            fallback={defaults.sizes[role]}
            min={role === "body" ? 6 : 5}
            max={role === "body" ? 24 : 60}
            unit="pt"
            onChange={(value) =>
              role === "body"
                ? onChange({ bodySize: value ?? template.bodySize })
                : onChange({ sizes: { ...style.sizes, [role]: value } })
            }
          />
        ))}
      </SettingsGroup>
      <SettingsGroup title="Text weights">
        {textRoles.map(([role, label]) => (
          <SelectSetting
            key={role}
            label={label}
            accessibleLabel={label + " weight"}
            value={style.weights?.[role] ?? defaults.weights[role]}
            defaultValue={defaults.weights[role]}
            options={weightOptions}
            onChange={(value) =>
              onChange({ weights: { ...style.weights, [role]: value } })
            }
          />
        ))}
      </SettingsGroup>
      <SettingsGroup title="Header padding">
        {(["top", "right", "bottom", "left"] as const).map((edge) => (
          <NumberSetting
            key={edge}
            label={
              edge.charAt(0).toUpperCase() + edge.slice(1) + " header padding"
            }
            value={style.headerPadding?.[edge]}
            fallback={headerPadding[edge]}
            min={0}
            max={45}
            unit="mm"
            onChange={(value) =>
              onChange({
                headerPadding: { ...style.headerPadding, [edge]: value },
              })
            }
          />
        ))}
      </SettingsGroup>
      <SettingsGroup title="Vertical spacing">
        {spacingRoles.map(([role, label]) => (
          <NumberSetting
            key={role}
            className={role === "headings" ? "col-span-2" : undefined}
            label={label}
            value={style.spacing?.[role]}
            fallback={defaults.spacing[role]}
            min={0}
            max={60}
            unit="pt"
            onChange={(value) =>
              onChange({ spacing: { ...style.spacing, [role]: value } })
            }
          />
        ))}
      </SettingsGroup>
    </>
  );
};

export { AdvancedDesignSettings };
