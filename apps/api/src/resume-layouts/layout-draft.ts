import { z } from "zod";
import type {
  DraftContent,
  RichBlock,
  RichListItem,
} from "../../../../packages/contracts/resume-content";
import { upgradeResumeContent } from "./upgrade-resume-content";
import { getResumeLayout, sectionIds } from "./layout-catalog";

const field = z.string().max(240);
const date = z.string().refine((value) => {
  if (!value) return true;
  if (!/^\d{4}(-\d{2}(-\d{2})?)?$/.test(value) || value.startsWith("0000"))
    return false;
  const padded =
    value.length === 4
      ? value + "-01-01"
      : value.length === 7
        ? value + "-01"
        : value;
  const parsed = new Date(padded + "T00:00:00Z");
  return (
    !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(padded)
  );
}, "Enter a valid date.");
const range = { startDate: date, endDate: date };
const id = z.string().min(1).max(64);
const picture = z
  .string()
  .max(180_000)
  .regex(/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/);

const paragraph = z.object({
  type: z.literal("paragraph"),
  content: z
    .array(
      z.discriminatedUnion("type", [
        z.object({ type: z.literal("hardBreak") }),
        z.object({
          type: z.literal("text"),
          text: z.string().max(32_000),
          marks: z
            .array(z.object({ type: z.enum(["bold", "italic", "underline"]) }))
            .max(3)
            .optional(),
        }),
      ]),
    )
    .max(500)
    .optional(),
});

function richBlock(depth: number): z.ZodType<RichBlock> {
  if (!depth) return paragraph;
  const item: z.ZodType<RichListItem> = z.object({
    type: z.literal("listItem"),
    content: z.tuple(
      [paragraph],
      z.lazy(() => richBlock(depth - 1)),
    ),
  });
  return z.union([
    paragraph,
    z.object({
      type: z.literal("bulletList"),
      content: z.array(item).max(100),
    }),
    z.object({
      type: z.literal("orderedList"),
      attrs: z
        .object({ start: z.number().int().min(1).max(9999).optional() })
        .optional(),
      content: z.array(item).max(100),
    }),
  ]);
}

const description = z.object({
  type: z.literal("doc"),
  content: z.array(richBlock(8)).max(300).optional(),
});
const contentSchema = z.object({
  contact: z.object({
    firstName: field,
    lastName: field,
    pronouns: field,
    email: field,
    linkedin: field,
    address: field,
    phone: field,
    website: field,
    github: field,
  }),
  targetTitle: field,
  summary: z.string().max(8000),
  experience: z
    .array(
      z.object({
        id,
        position: field,
        description,
        location: field,
        employmentType: field,
        ...range,
        current: z.boolean(),
      }),
    )
    .max(50),
  education: z
    .array(
      z.object({
        id,
        university: field,
        location: field,
        degree: field,
        fieldOfStudy: field,
        gpa: field,
        ...range,
        description,
      }),
    )
    .max(50),
  skills: z
    .array(
      z.object({
        id,
        category: field,
        skills: z
          .array(
            z.object({
              id,
              name: field,
              level: z.enum([
                "",
                "Beginner",
                "Intermediate",
                "Advanced",
                "Expert",
              ]),
            }),
          )
          .max(50),
      }),
    )
    .max(50),
  certifications: z
    .array(z.object({ id, name: field, provider: field, ...range }))
    .max(50),
  awards: z
    .array(z.object({ id, name: field, organization: field, date }))
    .max(50),
  projects: z
    .array(
      z.object({ id, name: field, organization: field, ...range, description }),
    )
    .max(50),
  volunteering: z
    .array(
      z.object({
        id,
        organization: field,
        involvement: field,
        city: field,
        state: field,
        ...range,
        description,
      }),
    )
    .max(50),
  publications: z
    .array(z.object({ id, name: field, publisher: field, date, description }))
    .max(50),
}) satisfies z.ZodType<DraftContent>;

const previousText = z.string().max(1600);
const previousContentSchema = z
  .object({
    name: field,
    role: field,
    contact: field,
    summary: previousText,
    experience: z
      .array(
        z.object({
          title: field,
          dates: field,
          details: previousText,
          projects: previousText.optional(),
        }),
      )
      .max(4),
    achievements: previousText,
    strengths: previousText.default(""),
    skills: previousText,
    education: previousText,
    training: previousText,
    languages: previousText,
    projects: previousText,
    focus: previousText.default(""),
  })
  .transform(upgradeResumeContent);

const marginSize = z.number().min(5).max(45);
const textSize = z.number().min(5).max(60);
const pointGap = z.number().min(0).max(60);
const textWeight = z.literal([200, 300, 400, 600, 700]);

export const layoutDraftSchema = z.object({
  layoutId: z
    .string()
    .refine((value) => Boolean(getResumeLayout(value)), "Unknown template"),
  sectionOrder: z.array(z.enum(sectionIds)).max(sectionIds.length).optional(),
  content: z.union([contentSchema, previousContentSchema]),
  style: z.object({
    accent: z.string().regex(/^#[a-f\d]{6}$/i),
    font: z.enum(["sans", "humanist", "serif", "editorial", "inter"]),
    bodySize: z.number().min(6).max(24),
    sectionGap: z.number().min(2).max(13),
    margin: z.number().min(8).max(27),
    lineHeight: z.number().min(0.9).max(2.5),
    showPhoto: z.boolean(),
    paperSize: z.enum(["a4", "letter"]).optional(),
    listLineHeight: z.number().min(0.9).max(2.5).optional(),
    dateFormat: z.enum(["numeric", "year", "short", "long"]).optional(),
    headerAlignment: z.enum(["left", "center", "right"]).optional(),
    dateAlignment: z.enum(["left", "right"]).optional(),
    locationAlignment: z.enum(["left", "right"]).optional(),
    employmentTypeAlignment: z.enum(["left", "right"]).optional(),
    dateNewLine: z.boolean().optional(),
    locationNewLine: z.boolean().optional(),
    employmentTypeNewLine: z.boolean().optional(),
    skillsLayout: z.enum(["inline", "list", "bullet", "columns"]).optional(),
    margins: z
      .object({
        top: marginSize,
        right: marginSize,
        bottom: marginSize,
        left: marginSize,
      })
      .partial()
      .optional(),
    sizes: z
      .object({
        primary: textSize,
        secondary: textSize,
        section: textSize,
        name: textSize,
        minor: textSize,
      })
      .partial()
      .optional(),
    weights: z
      .object({
        body: textWeight,
        primary: textWeight,
        secondary: textWeight,
        section: textWeight,
        name: textWeight,
        minor: textWeight,
      })
      .partial()
      .optional(),
    spacing: z
      .object({
        sections: pointGap,
        titleContent: pointGap,
        headings: pointGap,
        blocks: pointGap,
        listItems: pointGap,
      })
      .partial()
      .optional(),
  }),
  photo: picture.optional(),
  logo: picture.optional(),
});

export type LayoutDraft = z.infer<typeof layoutDraftSchema>;
