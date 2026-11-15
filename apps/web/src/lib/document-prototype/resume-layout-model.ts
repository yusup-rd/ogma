import type {
  DesignDefaults,
  DesignOptions,
  DraftContent,
  ResumeSectionId,
} from "../../../../../packages/contracts/resume-content";
export type { DraftContent } from "../../../../../packages/contracts/resume-content";

export interface TemplateOption {
  id: string;
  name: string;
  header: string;
  rail: string;
  heading: string;
  photo: string;
  photoShape: "circle" | "square";
  logos: string;
  font: string;
  accent: string;
  paper: string;
  sideColor?: string;
  main: ResumeSectionId[];
  side: ResumeSectionId[];
  ratio: number;
  bodySize: number;
  sectionGap: number;
  margin: number;
  timeline: boolean;
  lineHeight: number;
  showSkillLevels: boolean;
  designDefaults: DesignDefaults;
}

export interface TemplateStyle extends DesignOptions {
  font: string;
  accent: string;
  bodySize: number;
  sectionGap: number;
  margin: number;
  lineHeight: number;
  showPhoto: boolean;
}

export interface ResumeDraft {
  layoutId: string;
  sectionOrder?: ResumeSectionId[];
  content: DraftContent;
  style: TemplateStyle;
  photo?: string;
  logo?: string;
}

export interface TemplateCatalog {
  layouts: TemplateOption[];
  fonts: { value: string; label: string }[];
  sample: DraftContent;
}

export const defaultStyle = (template: TemplateOption): TemplateStyle => ({
  font: template.font,
  accent: template.accent,
  bodySize: template.bodySize,
  sectionGap: template.sectionGap,
  margin: template.margin,
  lineHeight: template.lineHeight,
  showPhoto: template.photo !== "none",
});
