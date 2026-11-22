import { useState, type ReactNode } from "react";
import {
  templatePhotoSize,
  templateHeaderPadding,
} from "@ogma/contracts/resolve-resume";
import { LuCheck } from "react-icons/lu";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { ratioToPercent } from "@/lib/formatUtil";
import type {
  TemplateOption,
  TemplateStyle,
} from "@/lib/document-prototype/resume-layout-model";
import type { EditorSectionId } from "@/lib/document-prototype/content-presentation";
import { SectionSettings } from "./section-settings";
import { SelectSetting } from "./select-setting";

interface TemplateDesignFormProps {
  template: TemplateOption;
  style: TemplateStyle;
  fonts: { value: TemplateStyle["font"]; label: string }[];
  onChange: (changes: Partial<TemplateStyle>) => void;
  onReset: () => void;
  gallery: ReactNode;
  sectionOrder: EditorSectionId[];
}

const fieldClass =
  "min-h-10 w-full min-w-0 rounded-lg border border-line bg-paper px-3 text-sm font-normal focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent";
const palettes = [
  { name: "Ink", color: "#242726" },
  { name: "Brown", color: "#6B4B36" },
  { name: "Navy", color: "#25475A" },
  { name: "Purple", color: "#663994" },
  { name: "Green", color: "#286F5D" },
];
const textRoles = [
  ["body", "Body copy"],
  ["primary", "Primary heading"],
  ["secondary", "Secondary heading"],
  ["section", "Section titles"],
  ["name", "Full name"],
  ["minor", "Minor copy"],
] as const;
const spacingRoles = [
  ["sections", "Between sections"],
  ["titleContent", "Between titles and content"],
  ["headings", "Between primary and secondary headings"],
  ["blocks", "Between content blocks"],
  ["listItems", "Between list items"],
] as const;
const weightOptions = [
  [200, "Extra light"],
  [300, "Light"],
  [400, "Regular"],
  [600, "Semibold"],
  [700, "Bold"],
] as const;
const dateOptions = [
  ["numeric", "Numbers (MM/YYYY)"],
  ["year", "Year (YYYY)"],
  ["short", "Short month (Jan YYYY)"],
  ["long", "Long month (January YYYY)"],
] as const;
const dateSeparators = [
  ["dash", "En dash (–)"],
  ["hyphen", "Hyphen (-)"],
] as const;
const alignmentOptions = [
  ["left", "Left"],
  ["right", "Right"],
] as const;
const workHeadingOptions = [
  ["position-first", "Role first"],
  ["employer-first", "Employer first"],
] as const;
const workPlacementOptions = [
  ["first", "First heading row"],
  ["second", "Second heading row"],
  ["below", "Below both headings"],
  ["rail", "Timeline rail"],
] as const;
const headerOptions = [
  ["left", "Left"],
  ["center", "Center"],
  ["right", "Right"],
] as const;
const skillOptions = [
  ["inline", "Comma separated"],
  ["list", "Comma separated list"],
  ["bullet", "Bullet separated"],
  ["columns", "Columns"],
  ["lined", "Underlined items"],
] as const;

const proficiencyOptions = [
  ["dots", "Dots"],
  ["bold-dots", "Large dots"],
  ["sticks", "Rounded sticks"],
  ["bar", "Progress bar"],
] as const;

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
        className="size-4 shrink-0 accent-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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
  const update = (value: number) =>
    onChange(inheritDefault && value === fallback ? undefined : value);
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

const metadataControls = [
  {
    label: "Date",
    field: "date",
    alignment: "dateAlignment",
    newLine: "dateNewLine",
    placement: "workDatePlacement",
  },
  {
    label: "Location",
    field: "location",
    alignment: "locationAlignment",
    newLine: "locationNewLine",
    placement: "workLocationPlacement",
  },
  {
    label: "Employment type",
    field: "employmentType",
    alignment: "employmentTypeAlignment",
    newLine: "employmentTypeNewLine",
    placement: "workEmploymentTypePlacement",
  },
] as const;

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

const TemplateDesignForm = ({
  template,
  style,
  fonts,
  onChange,
  onReset,
  gallery,
  sectionOrder,
}: TemplateDesignFormProps) => {
  const [tab, setTab] = useState<"Classic Settings" | "Advanced">(
    "Classic Settings",
  );
  const defaults = template.designDefaults;
  const headerPadding = templateHeaderPadding(style, template);
  const workDefaults = defaults.workExperience;
  const defaultIndicator =
    defaults.proficiencyIndicator === "none"
      ? undefined
      : defaults.proficiencyIndicator;
  const showProficiency =
    style.showProficiency ?? defaultIndicator !== undefined;
  const isCustom = !palettes.some(
    ({ color }) => color.toLowerCase() === style.accent.toLowerCase(),
  );
  const setLeading = (value?: number) =>
    onChange({
      lineHeight: value === undefined ? template.lineHeight : value / 100,
    });

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div
        role="group"
        aria-label="Design settings"
        className="flex flex-wrap items-center gap-1 rounded-xl border border-line bg-canvas p-1"
      >
        {(["Classic Settings", "Advanced"] as const).map((name) => (
          <button
            key={name}
            type="button"
            aria-pressed={tab === name}
            onClick={() => setTab(name)}
            className="min-h-9 flex-1 rounded-lg px-2 text-xs font-semibold text-muted hover:text-ink aria-pressed:bg-paper aria-pressed:text-accent aria-pressed:shadow-xs"
          >
            {name}
          </button>
        ))}
      </div>
      {tab === "Classic Settings" ? (
        <>
          {gallery}
          <SettingsGroup title="Styling">
            <div className="col-span-2">
              <SelectSetting
                label="Font family"
                value={style.font}
                defaultValue={template.font}
                options={fonts.map(
                  ({ value, label }) => [value, label] as const,
                )}
                onChange={(font) => onChange({ font })}
              />
            </div>
            <NumberSetting
              label="Line height"
              value={
                style.lineHeight === template.lineHeight
                  ? undefined
                  : ratioToPercent(style.lineHeight, 2)
              }
              fallback={ratioToPercent(template.lineHeight, 2)}
              min={90}
              max={250}
              unit="%"
              onChange={setLeading}
            />
            <NumberSetting
              label="List line height"
              value={
                style.listLineHeight === undefined
                  ? undefined
                  : ratioToPercent(style.listLineHeight, 2)
              }
              fallback={ratioToPercent(template.lineHeight, 2)}
              min={90}
              max={250}
              unit="%"
              onChange={(value) =>
                onChange({
                  listLineHeight: value === undefined ? undefined : value / 100,
                })
              }
            />
            <div className="col-span-2 flex flex-col gap-1">
              <span className="text-xs font-semibold" id="design-accent">
                Accent color
              </span>
              <div
                role="group"
                aria-labelledby="design-accent"
                className="flex flex-wrap items-center gap-1"
              >
                {palettes.map(({ name, color }) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={name}
                    aria-pressed={
                      style.accent.toLowerCase() === color.toLowerCase()
                    }
                    onClick={() => onChange({ accent: color })}
                    className="grid size-9 place-items-center rounded-full text-white"
                  >
                    <span
                      style={{ backgroundColor: color }}
                      className="grid size-7 place-items-center rounded-full"
                    >
                      {style.accent.toLowerCase() === color.toLowerCase() && (
                        <LuCheck aria-hidden="true" className="size-4" />
                      )}
                    </span>
                  </button>
                ))}
                <label
                  className={`relative inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-lg text-xs font-semibold focus-within:outline-2 focus-within:outline-accent ${isCustom ? "pr-1.5 text-accent" : "ml-1 border border-line bg-paper px-2.5"}`}
                >
                  {isCustom && (
                    <span className="grid size-9 place-items-center">
                      <span
                        className="grid size-7 place-items-center rounded-full text-white ring-1 ring-ink/25 ring-inset"
                        style={{ backgroundColor: style.accent }}
                      >
                        <LuCheck
                          aria-hidden="true"
                          className="size-4 drop-shadow-[0_1px_1px_#0009]"
                        />
                      </span>
                    </span>
                  )}
                  {isCustom ? "Custom" : "Custom color"}
                  <input
                    type="color"
                    aria-label={
                      isCustom
                        ? `Custom accent selected ${style.accent}`
                        : "Custom color"
                    }
                    value={style.accent}
                    className="absolute inset-0 size-full cursor-pointer opacity-0"
                    onChange={(event) =>
                      onChange({ accent: event.currentTarget.value })
                    }
                  />
                </label>
              </div>
            </div>
            <div className="col-span-2 grid gap-3 sm:grid-cols-2">
              <SelectSetting
                label="Date format"
                value={style.dateFormat ?? defaults.dateFormat}
                defaultValue={defaults.dateFormat}
                options={dateOptions}
                onChange={(dateFormat) => onChange({ dateFormat })}
              />
              <SelectSetting
                label="Date range separator"
                value={style.dateSeparator ?? defaults.dateSeparator}
                defaultValue={defaults.dateSeparator}
                options={dateSeparators}
                onChange={(dateSeparator) => onChange({ dateSeparator })}
              />
            </div>
          </SettingsGroup>
          <SettingsGroup title="Alignment and layout">
            <SelectSetting
              label="Header alignment"
              value={style.headerAlignment ?? defaults.headerAlignment}
              defaultValue={defaults.headerAlignment}
              options={headerOptions}
              onChange={(headerAlignment) => onChange({ headerAlignment })}
            />
            {metadataControls.map(({ label, field, alignment, newLine }) => (
              <div
                key={alignment}
                className="col-span-2 grid grid-cols-2 items-end gap-3"
              >
                <SelectSetting
                  label={label + " alignment"}
                  value={
                    style[alignment] ??
                    workDefaults?.[field].alignment ??
                    defaults[alignment]
                  }
                  defaultValue={
                    workDefaults?.[field].alignment ?? defaults[alignment]
                  }
                  options={alignmentOptions}
                  onChange={(value) => onChange({ [alignment]: value })}
                />
                <label className="flex min-h-10 items-center gap-2 text-xs font-semibold text-muted">
                  <input
                    type="checkbox"
                    aria-label={label + " on a new line"}
                    checked={style[newLine] ?? false}
                    onChange={(event) =>
                      onChange({ [newLine]: event.currentTarget.checked })
                    }
                    className="size-4 rounded accent-accent"
                  />
                  New line
                </label>
              </div>
            ))}
          </SettingsGroup>
          {workDefaults && (
            <SettingsGroup title="Work experience">
              <SelectSetting
                label="Heading order"
                value={style.workHeadingOrder ?? workDefaults.order}
                defaultValue={workDefaults.order}
                options={workHeadingOptions}
                onChange={(workHeadingOrder) =>
                  onChange({
                    workHeadingOrder:
                      workHeadingOrder === workDefaults.order
                        ? undefined
                        : workHeadingOrder,
                  })
                }
              />
              <SelectSetting
                label="Work date format"
                value={
                  style.workDateFormat ??
                  style.dateFormat ??
                  workDefaults.dateFormat
                }
                defaultValue={workDefaults.dateFormat}
                options={dateOptions}
                onChange={(workDateFormat) => onChange({ workDateFormat })}
              />
              <SelectSetting
                label="Work date range separator"
                value={
                  style.workDateSeparator ??
                  style.dateSeparator ??
                  workDefaults.dateSeparator
                }
                defaultValue={workDefaults.dateSeparator}
                options={dateSeparators}
                onChange={(workDateSeparator) =>
                  onChange({ workDateSeparator })
                }
              />
              {metadataControls.map(
                ({ label, field, alignment, placement, newLine }) => {
                  const position = workDefaults[field];
                  const defaultPlacement = position.placement;
                  const inheritedPlacement = style[newLine]
                    ? "own-line"
                    : defaultPlacement === "rail" &&
                        style[alignment] === "right"
                      ? "first"
                      : defaultPlacement;
                  return (
                    <SelectSetting
                      key={placement}
                      label={label + " placement"}
                      value={style[placement] ?? inheritedPlacement}
                      defaultValue={defaultPlacement}
                      options={
                        [
                          ...workPlacementOptions.filter(
                            ([row]) => row !== "rail" || template.timeline,
                          ),
                          ["own-line", "On its own line"],
                        ] as const
                      }
                      onChange={(value) =>
                        onChange({
                          [placement]:
                            value === inheritedPlacement ? undefined : value,
                        })
                      }
                    />
                  );
                },
              )}
              <ToggleSetting
                label="Date and location icons"
                checked={style.showWorkMetadataIcons ?? workDefaults.icons}
                onChange={(showWorkMetadataIcons) =>
                  onChange({
                    showWorkMetadataIcons:
                      showWorkMetadataIcons === workDefaults.icons
                        ? undefined
                        : showWorkMetadataIcons,
                  })
                }
              />
            </SettingsGroup>
          )}
          <SettingsGroup title="Skills">
            <div className="col-span-2">
              <SelectSetting
                label="Skills layout"
                value={style.skillsLayout ?? defaults.skillsLayout}
                defaultValue={defaults.skillsLayout}
                options={skillOptions}
                onChange={(skillsLayout) => onChange({ skillsLayout })}
              />
            </div>
            <ToggleSetting
              label="Show skill group names"
              checked={style.groupSkills ?? defaults.groupSkills}
              onChange={(groupSkills) => onChange({ groupSkills })}
            />
            <ToggleSetting
              label="Show proficiency"
              checked={showProficiency}
              onChange={(showProficiency) => onChange({ showProficiency })}
            />
            {showProficiency && (
              <div className="col-span-2">
                <SelectSetting
                  label="Proficiency indicator"
                  value={
                    style.proficiencyIndicator ?? defaultIndicator ?? "dots"
                  }
                  defaultValue={defaultIndicator}
                  options={proficiencyOptions}
                  onChange={(proficiencyIndicator) =>
                    onChange({ proficiencyIndicator })
                  }
                />
              </div>
            )}
          </SettingsGroup>
          <SettingsGroup title="Visual details">
            <ToggleSetting
              label="Include contact icons"
              checked={style.showContactIcons ?? defaults.showContactIcons}
              onChange={(showContactIcons) => onChange({ showContactIcons })}
            />
            <ToggleSetting
              label="Show section heading icons"
              checked={style.showSectionIcons ?? defaults.showSectionIcons}
              onChange={(showSectionIcons) => onChange({ showSectionIcons })}
            />
            {template.photo !== "none" && (
              <>
                <ToggleSetting
                  label="Show profile photo"
                  checked={style.showPhoto}
                  onChange={(showPhoto) => onChange({ showPhoto })}
                />
                <NumberSetting
                  className="col-span-2"
                  label="Photo size"
                  inheritDefault={false}
                  value={style.photoSize}
                  fallback={templatePhotoSize(style, template)}
                  min={10}
                  max={50}
                  unit="mm"
                  onChange={(photoSize) => onChange({ photoSize })}
                />
              </>
            )}
          </SettingsGroup>
          <SettingsGroup title="Projects">
            <ToggleSetting
              label="Show job project tables"
              checked={style.workProjectTables ?? defaults.workProjectTables}
              onChange={(workProjectTables) => onChange({ workProjectTables })}
            />
            <ToggleSetting
              label="Show standalone projects in a table"
              checked={style.projectTable ?? defaults.projectTable}
              onChange={(projectTable) => onChange({ projectTable })}
            />
          </SettingsGroup>
          <SettingsGroup title="Page setup">
            <div className="col-span-2">
              <SelectSetting
                label="Paper size"
                value={style.paperSize ?? "a4"}
                defaultValue={"a4"}
                options={[
                  ["a4", "A4 · 210 × 297 mm"],
                  ["letter", "US Letter · 8.5 × 11 in"],
                ]}
                onChange={(paperSize) => onChange({ paperSize })}
              />
            </div>
            {(["left", "right", "top", "bottom"] as const).map((edge) => (
              <NumberSetting
                key={edge}
                label={edge.charAt(0).toUpperCase() + edge.slice(1) + " margin"}
                value={style.margins?.[edge]}
                fallback={template.margins?.[edge] ?? template.margin}
                min={5}
                max={45}
                unit="mm"
                onChange={(value) =>
                  onChange({ margins: { ...style.margins, [edge]: value } })
                }
              />
            ))}
          </SettingsGroup>
        </>
      ) : (
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
                  edge.charAt(0).toUpperCase() +
                  edge.slice(1) +
                  " header padding"
                }
                value={style.headerPadding?.[edge]}
                fallback={headerPadding[edge]}
                min={0}
                max={Math.max(20, headerPadding[edge])}
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
      )}
      <SettingsGroup title="Section settings">
        {sectionOrder
          .filter((section) => section !== "personal")
          .map((section) => (
            <SectionSettings
              key={section}
              section={section}
              style={style}
              onChange={onChange}
            />
          ))}
      </SettingsGroup>
      <ConfirmationDialog
        trigger={
          <button
            type="button"
            className="min-h-10 self-start rounded-lg border border-line px-3 text-sm font-semibold hover:bg-canvas"
          >
            Reset template settings
          </button>
        }
        title="Reset template settings?"
        description={`Restore the original design settings for ${template.name}. Your resume content and uploaded images will be kept.`}
        confirmLabel="Reset settings"
        action={onReset}
      />
    </div>
  );
};

export { TemplateDesignForm };
