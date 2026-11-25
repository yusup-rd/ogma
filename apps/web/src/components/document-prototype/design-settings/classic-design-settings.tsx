import type { ReactNode } from "react";
import { templatePhotoSize } from "@ogma/contracts/resolve-resume";
import { LuCheck } from "react-icons/lu";
import { ratioToPercent } from "@/lib/formatUtil";
import type {
  TemplateOption,
  TemplateStyle,
} from "@/lib/document-prototype/resume-layout-model";
import {
  NumberSetting,
  SettingsGroup,
  ToggleSetting,
} from "../design-setting-controls";
import { SelectSetting } from "../select-setting";
import {
  alignmentOptions,
  dateOptions,
  dateSeparators,
  headerOptions,
  metadataControls,
  palettes,
  proficiencyOptions,
  skillOptions,
  workHeadingOptions,
  workPlacementOptions,
} from "./design-setting-options";

interface ClassicDesignSettingsProps {
  template: TemplateOption;
  style: TemplateStyle;
  fonts: { value: TemplateStyle["font"]; label: string }[];
  gallery: ReactNode;
  onChange: (changes: Partial<TemplateStyle>) => void;
}

const ClassicDesignSettings = ({
  template,
  style,
  fonts,
  gallery,
  onChange,
}: ClassicDesignSettingsProps) => {
  const defaults = template.designDefaults;
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
    <>
      {gallery}
      <SettingsGroup title="Styling">
        <div className="col-span-2">
          <SelectSetting
            label="Font family"
            value={style.font}
            defaultValue={template.font}
            options={fonts.map(({ value, label }) => [value, label] as const)}
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
                className="size-4"
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
            onChange={(workDateSeparator) => onChange({ workDateSeparator })}
          />
          {metadataControls.map(
            ({ label, field, alignment, placement, newLine }) => {
              const position = workDefaults[field];
              const defaultPlacement = position.placement;
              const inheritedPlacement = style[newLine]
                ? "own-line"
                : defaultPlacement === "rail" && style[alignment] === "right"
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
              value={style.proficiencyIndicator ?? defaultIndicator ?? "dots"}
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
  );
};

export { ClassicDesignSettings };
