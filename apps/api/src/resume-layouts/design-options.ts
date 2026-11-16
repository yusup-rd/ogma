import type {
  DesignDefaults,
  DesignOptions,
  PaperSize,
  ProficiencyIndicator,
} from "../../../../packages/contracts/resume-content";
import type { ResumeLayout } from "./layout-catalog";

export function resolveProficiency(
  style: DesignOptions,
  defaultIndicator: ProficiencyIndicator,
): ProficiencyIndicator {
  const shown = style.showProficiency ?? defaultIndicator !== "none";
  return shown
    ? (style.proficiencyIndicator ??
        (defaultIndicator === "none" ? "dots" : defaultIndicator))
    : "none";
}

const papers = {
  a4: { width: 210, height: 297 },
  letter: { width: 215.9, height: 279.4 },
} satisfies Record<PaperSize, { width: number; height: number }>;

export function paperDimensions(options: DesignOptions) {
  return papers[options.paperSize ?? "a4"];
}

export function pageMargins(
  options: DesignOptions & { margin: number },
  layout: ResumeLayout,
) {
  return {
    top: options.margins?.top ?? layout.margins?.top ?? options.margin,
    right: options.margins?.right ?? layout.margins?.right ?? options.margin,
    bottom: options.margins?.bottom ?? layout.margins?.bottom ?? options.margin,
    left: options.margins?.left ?? layout.margins?.left ?? options.margin,
  };
}

const nameScale: Record<string, [number, DesignDefaults["weights"]["name"]]> = {
  crest: [3.55, 400],
  "crest-projects": [3.55, 400],
  contemporary: [3.08, 400],
  modern: [2.62, 700],
  stylish: [2.56, 400],
  imprint: [3.6, 400],
  elegant: [2.56, 400],
  compact: [2.2, 400],
  classic: [2.65, 700],
  "high-performer": [2.17, 400],
  minimal: [2.3, 400],
};
const regularSectionTitles = new Set([
  "compact",
  "minimal",
  "elegant",
  "polished",
  "elegant-logos",
  "creative",
  "stylish",
  "modern",
  "high-performer",
]);
const sectionScale: Record<string, number> = {
  compact: 0.89,
  minimal: 0.95,
  contemporary: 1.08,
};
const blockScale: Record<string, number> = {
  "double-column": 1.55,
  "elegant-logos": 1.55,
  classic: 1.65,
};
const listScale: Record<string, number> = {
  "double-column": 0.29,
  creative: 0.29,
  stylish: 0.29,
  modern: 0.29,
  "elegant-logos": 0.29,
  compact: 0.29,
  elegant: 0.3,
  classic: 0.3,
  contemporary: 0.22,
};
const decimal = (value: number) => Math.round(value * 100) / 100;
const regularPrimary = new Set([
  "elegant",
  "crest",
  "crest-projects",
  "compact",
  "high-performer",
  "imprint",
  "minimal",
]);
const lightTitle = new Set([
  "contemporary",
  "crest",
  "crest-projects",
  "imprint",
  "high-performer",
]);

type SkillDefaults = Pick<
  DesignDefaults,
  "skillsLayout" | "groupSkills" | "proficiencyIndicator"
>;
const skillDefaults: Record<string, SkillDefaults> = {
  "double-column": {
    skillsLayout: "lined",
    groupSkills: false,
    proficiencyIndicator: "sticks",
  },
  "ivy-league": {
    skillsLayout: "inline",
    groupSkills: true,
    proficiencyIndicator: "none",
  },
  elegant: {
    skillsLayout: "lined",
    groupSkills: false,
    proficiencyIndicator: "bar",
  },
  crest: {
    skillsLayout: "bullet",
    groupSkills: false,
    proficiencyIndicator: "none",
  },
  "single-column": {
    skillsLayout: "lined",
    groupSkills: false,
    proficiencyIndicator: "sticks",
  },
  polished: {
    skillsLayout: "columns",
    groupSkills: false,
    proficiencyIndicator: "sticks",
  },
  imprint: {
    skillsLayout: "inline",
    groupSkills: false,
    proficiencyIndicator: "none",
  },
  timeline: {
    skillsLayout: "lined",
    groupSkills: false,
    proficiencyIndicator: "bar",
  },
  creative: {
    skillsLayout: "lined",
    groupSkills: false,
    proficiencyIndicator: "bold-dots",
  },
  stylish: {
    skillsLayout: "lined",
    groupSkills: false,
    proficiencyIndicator: "bar",
  },
  modern: {
    skillsLayout: "lined",
    groupSkills: false,
    proficiencyIndicator: "bar",
  },
  contemporary: {
    skillsLayout: "lined",
    groupSkills: true,
    proficiencyIndicator: "none",
  },
  "ivy-league-photo": {
    skillsLayout: "inline",
    groupSkills: false,
    proficiencyIndicator: "none",
  },
  "ivy-league-logos": {
    skillsLayout: "inline",
    groupSkills: false,
    proficiencyIndicator: "dots",
  },
  "single-column-photo": {
    skillsLayout: "lined",
    groupSkills: false,
    proficiencyIndicator: "none",
  },
  "elegant-logos": {
    skillsLayout: "lined",
    groupSkills: false,
    proficiencyIndicator: "none",
  },
  "double-column-logos": {
    skillsLayout: "lined",
    groupSkills: true,
    proficiencyIndicator: "sticks",
  },
  compact: {
    skillsLayout: "lined",
    groupSkills: false,
    proficiencyIndicator: "none",
  },
  "timeline-logos": {
    skillsLayout: "lined",
    groupSkills: false,
    proficiencyIndicator: "none",
  },
  classic: {
    skillsLayout: "bullet",
    groupSkills: true,
    proficiencyIndicator: "none",
  },
  "high-performer": {
    skillsLayout: "lined",
    groupSkills: false,
    proficiencyIndicator: "dots",
  },
  minimal: {
    skillsLayout: "bullet",
    groupSkills: true,
    proficiencyIndicator: "bold-dots",
  },
  "crest-projects": {
    skillsLayout: "bullet",
    groupSkills: false,
    proficiencyIndicator: "none",
  },
};

const plainContact = new Set([
  "ivy-league",
  "ivy-league-photo",
  "ivy-league-logos",
  "crest",
  "crest-projects",
  "classic",
  "imprint",
]);

export function designDefaults(layout: ResumeLayout): DesignDefaults {
  if (layout.id === "essential") {
    return {
      dateFormat: "numeric",
      dateSeparator: "hyphen",
      headerAlignment: "center",
      dateAlignment: "right",
      locationAlignment: "right",
      employmentTypeAlignment: "left",
      skillsLayout: "inline",
      groupSkills: true,
      proficiencyIndicator: "none",
      showContactIcons: false,
      showSectionIcons: false,
      workProjectTables: false,
      projectTable: false,
      sizes: {
        body: 10,
        primary: 11,
        secondary: 11,
        section: 10,
        name: 18,
        minor: 10,
      },
      weights: {
        body: 300,
        primary: 600,
        secondary: 600,
        section: 200,
        name: 600,
        minor: 300,
      },
      spacing: {
        sections: 18,
        titleContent: 8,
        headings: 0,
        blocks: 5,
        listItems: 2,
      },
    };
  }
  const [name, nameWeight] = nameScale[layout.id] ?? [
    layout.header === "center" ? 1.95 : 2.56,
    700,
  ];
  const section =
    sectionScale[layout.id] ??
    (layout.heading === "center-rule"
      ? 1.42
      : layout.heading === "spaced"
        ? 0.96
        : 1.2);
  const body = layout.bodySize;
  const sectionGap =
    ((layout.sectionGap * 72) / 25.4) *
    (layout.id === "classic"
      ? 1.32
      : ["elegant", "elegant-logos"].includes(layout.id)
        ? 1.52
        : 1);
  const alignment = layout.timeline ? "left" : "right";
  return {
    dateFormat: "short",
    dateSeparator: "dash",
    headerAlignment: layout.header === "center" ? "center" : "left",
    dateAlignment: alignment,
    locationAlignment: alignment,
    employmentTypeAlignment: alignment,
    ...skillDefaults[layout.id],
    showContactIcons: !plainContact.has(layout.id),
    showSectionIcons: layout.header === "badge",
    workProjectTables: layout.id === "high-performer",
    projectTable: false,
    sizes: {
      body,
      primary: decimal(body * 1.17),
      secondary: decimal(body * (layout.header === "center" ? 1 : 1.08)),
      section: decimal(body * section),
      name: decimal(body * name),
      minor: decimal(body * 0.89),
    },
    weights: {
      body: 400,
      primary:
        layout.heading === "center-rule" || regularPrimary.has(layout.id)
          ? 400
          : 700,
      secondary:
        layout.header === "center" || lightTitle.has(layout.id) ? 400 : 600,
      section: regularSectionTitles.has(layout.id) ? 400 : 700,
      name: nameWeight,
      minor: 400,
    },
    spacing: {
      sections: decimal(sectionGap),
      titleContent: decimal(body * section * 0.55),
      headings: decimal(body * 0.18),
      blocks: decimal(body * (blockScale[layout.id] ?? 1.34)),
      listItems: decimal(body * (listScale[layout.id] ?? 0.13)),
    },
  };
}
