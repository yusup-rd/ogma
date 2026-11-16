import { draftContentSchema } from "@ogma/contracts/resume-content-schema";
import type { ResolvedResume } from "@ogma/contracts/resolve-resume";
import {
  resumeFontSchema,
  type WorkspaceStyle,
} from "@ogma/contracts/resume-workspace";
import { z } from "zod";
import type {
  DesignDefaults,
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
  font: WorkspaceStyle["font"];
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
  designDefaults: DesignDefaults;
}

export type TemplateStyle = WorkspaceStyle;

export type ResumeDraft = ResolvedResume;

export interface TemplateCatalog {
  layouts: TemplateOption[];
  fonts: { value: WorkspaceStyle["font"]; label: string }[];
  sample: DraftContent;
}

const section = z.enum([
  "summary",
  "experience",
  "education",
  "skills",
  "certifications",
  "awards",
  "projects",
  "volunteering",
  "publications",
]);
const side = z.enum(["left", "right"]);
const weight = z.literal([200, 300, 400, 600, 700]);
const textRoles = z.enum([
  "body",
  "primary",
  "secondary",
  "section",
  "name",
  "minor",
]);
const spacingRoles = z.enum([
  "sections",
  "titleContent",
  "headings",
  "blocks",
  "listItems",
]);
const color = z.string().regex(/^#[a-f\d]{6}$/i);
const designDefaults = z.object({
  dateFormat: z.enum(["numeric", "year", "short", "long"]),
  headerAlignment: z.enum(["left", "center", "right"]),
  dateAlignment: side,
  locationAlignment: side,
  employmentTypeAlignment: side,
  skillsLayout: z.enum(["inline", "list", "bullet", "columns", "lined"]),
  groupSkills: z.boolean(),
  proficiencyIndicator: z.enum(["none", "dots", "bold-dots", "sticks", "bar"]),
  showContactIcons: z.boolean(),
  showSectionIcons: z.boolean(),
  workProjectTables: z.boolean(),
  projectTable: z.boolean(),
  sizes: z.record(textRoles, z.number()),
  weights: z.record(textRoles, weight),
  spacing: z.record(spacingRoles, z.number()),
});

export const templateCatalogSchema = z.object({
  layouts: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        header: z.enum(["left", "center", "banner", "badge"]),
        rail: z.enum(["none", "left", "right", "left-column"]),
        heading: z.enum([
          "underline",
          "center-rule",
          "spaced",
          "hairline",
          "plain",
        ]),
        photo: z.enum(["none", "top", "right", "rail"]),
        photoShape: z.enum(["circle", "square"]),
        logos: z.enum(["none", "left", "right"]),
        font: resumeFontSchema,
        accent: color,
        paper: color,
        sideColor: color.optional(),
        main: z.array(section),
        side: z.array(section),
        ratio: z.number(),
        bodySize: z.number(),
        sectionGap: z.number(),
        margin: z.number(),
        lineHeight: z.number(),
        timeline: z.boolean(),
        designDefaults,
      }),
    )
    .min(1),
  fonts: z
    .array(z.object({ value: resumeFontSchema, label: z.string() }))
    .min(1),
  sample: draftContentSchema,
}) satisfies z.ZodType<TemplateCatalog>;
