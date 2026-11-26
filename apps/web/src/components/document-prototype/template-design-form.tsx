import { useState, type ReactNode } from "react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import type {
  TemplateOption,
  TemplateStyle,
} from "@/lib/document-prototype/resume-layout-model";
import type { EditorSectionId } from "@/lib/document-prototype/content-presentation";
import { SectionSettings } from "./section-settings";
import { SettingsGroup } from "./design-setting-controls";
import { ClassicDesignSettings } from "./design-settings/classic-design-settings";
import { AdvancedDesignSettings } from "./design-settings/advanced-design-settings";

interface TemplateDesignFormProps {
  template: TemplateOption;
  style: TemplateStyle;
  fonts: { value: TemplateStyle["font"]; label: string }[];
  onChange: (changes: Partial<TemplateStyle>) => void;
  onReset: () => void;
  gallery: ReactNode;
  sectionOrder: EditorSectionId[];
}

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
        <ClassicDesignSettings
          template={template}
          style={style}
          fonts={fonts}
          gallery={gallery}
          onChange={onChange}
        />
      ) : (
        <AdvancedDesignSettings
          template={template}
          style={style}
          onChange={onChange}
        />
      )}{" "}
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
