import type {
  DesignDefaults,
  DesignOptions,
  PaperSize,
} from "../../../../packages/contracts/resume-content";
import type { ResumeLayout } from "./layout-catalog";

const papers = {
  a4: { width: 210, height: 297 },
  letter: { width: 215.9, height: 279.4 },
} satisfies Record<PaperSize, { width: number; height: number }>;

export function paperDimensions(options: DesignOptions) {
  return papers[options.paperSize ?? "a4"];
}

export function pageMargins(options: DesignOptions & { margin: number }) {
  return {
    top: options.margins?.top ?? options.margin,
    right: options.margins?.right ?? options.margin,
    bottom: options.margins?.bottom ?? options.margin,
    left: options.margins?.left ?? options.margin,
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

export function designDefaults(layout: ResumeLayout): DesignDefaults {
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
    headerAlignment: layout.header === "center" ? "center" : "left",
    dateAlignment: alignment,
    locationAlignment: alignment,
    employmentTypeAlignment: alignment,
    skillsLayout: layout.showSkillLevels ? "columns" : "bullet",
    sizes: {
      body,
      primary: decimal(body * 1.17),
      secondary: body,
      section: decimal(body * section),
      name: decimal(body * name),
      minor: decimal(body * 0.89),
    },
    weights: {
      body: 400,
      primary:
        layout.heading === "center-rule" ||
        layout.id === "elegant" ||
        layout.id === "crest" ||
        layout.id === "crest-projects"
          ? 400
          : 700,
      secondary: 400,
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
