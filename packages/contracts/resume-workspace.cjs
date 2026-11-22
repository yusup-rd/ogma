const { normalizeHiddenKeys } = require("./selection-keys.cjs");
const { z } = require("zod");
const {
  draftContentSchema,
  picture,
  photoCrop,
} = require("./resume-content-schema.cjs");

const { libraryEntryContentSchema } = require("./content-library.cjs");

const marginSize = z.number().min(5).max(45);
const textSize = z.number().min(5).max(60);
const pointGap = z.number().min(0).max(60);
const textWeight = z.literal([200, 300, 400, 600, 700]);
const workMetadataPlacement = z.enum([
  "first",
  "second",
  "below",
  "rail",
  "own-line",
]);
const resumeFontSchema = z.enum([
  "sans",
  "humanist",
  "serif",
  "editorial",
  "inter",
  "poppins",
]);

const resumeStyleSchema = z.object({
  accent: z.string().regex(/^#[a-f\d]{6}$/i),
  font: resumeFontSchema,
  bodySize: z.number().min(6).max(24),
  sectionGap: z.number().min(2).max(13),
  margin: z.number().min(8).max(27),
  lineHeight: z.number().min(0.9).max(2.5),
  showPhoto: z.boolean(),
  photoSize: z.number().min(10).max(50).optional(),
  headerPadding: z
    .object({
      top: z.number().min(0).max(45),
      right: z.number().min(0).max(45),
      bottom: z.number().min(0).max(45),
      left: z.number().min(0).max(45),
    })
    .partial()
    .optional(),
  sectionOverrides: z
    .partialRecord(
      z.enum([
        "summary",
        "experience",
        "education",
        "skills",
        "languages",
        "certifications",
        "awards",
        "projects",
        "volunteering",
        "publications",
      ]),
      z.object({
        title: z.string().trim().min(1).max(120).optional(),
        headingSize: textSize.optional(),
        headingWeight: textWeight.optional(),
        letterSpacing: z.number().min(-1).max(5).optional(),
        bulletSpacing: z.number().min(0).max(15).optional(),
        sectionGap: z.number().min(0).max(20).optional(),
        lineHeight: z.number().min(0.9).max(2.5).optional(),
        breakBefore: z.boolean().optional(),
      }),
    )
    .optional(),
  paperSize: z.enum(["a4", "letter"]).optional(),
  listLineHeight: z.number().min(0.9).max(2.5).optional(),
  dateFormat: z.enum(["numeric", "year", "short", "long"]).optional(),
  dateSeparator: z.enum(["dash", "hyphen"]).optional(),
  headerAlignment: z.enum(["left", "center", "right"]).optional(),
  dateAlignment: z.enum(["left", "right"]).optional(),
  locationAlignment: z.enum(["left", "right"]).optional(),
  employmentTypeAlignment: z.enum(["left", "right"]).optional(),
  dateNewLine: z.boolean().optional(),
  locationNewLine: z.boolean().optional(),
  employmentTypeNewLine: z.boolean().optional(),
  workHeadingOrder: z.enum(["position-first", "employer-first"]).optional(),
  workDateFormat: z.enum(["numeric", "year", "short", "long"]).optional(),
  workDateSeparator: z.enum(["dash", "hyphen"]).optional(),
  workDatePlacement: workMetadataPlacement.optional(),
  workLocationPlacement: workMetadataPlacement.optional(),
  workEmploymentTypePlacement: workMetadataPlacement.optional(),
  showWorkMetadataIcons: z.boolean().optional(),
  skillsLayout: z
    .enum(["inline", "list", "bullet", "columns", "lined"])
    .optional(),
  groupSkills: z.boolean().optional(),
  showProficiency: z.boolean().optional(),
  proficiencyIndicator: z
    .enum(["dots", "bold-dots", "sticks", "bar"])
    .optional(),
  showContactIcons: z.boolean().optional(),
  showSectionIcons: z.boolean().optional(),
  workProjectTables: z.boolean().optional(),
  projectTable: z.boolean().optional(),
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
});

const editorSectionSchema = z.enum([
  "personal",
  "summary",
  "experience",
  "education",
  "skills",
  "languages",
  "certifications",
  "awards",
  "projects",
  "volunteering",
  "publications",
]);
const titleSchema = z.string().trim().min(1).max(120);
const librarySource = z.object({
  entryId: z.uuid(),
  libraryId: z.uuid(),
  revision: z.int().min(1).max(2_147_483_646),
  content: libraryEntryContentSchema,
});
const resumeDocumentInputSchema = z.object({
  schemaVersion: z.literal(1),
  layoutId: z.string().min(1).max(100),
  sectionOrder: z
    .array(editorSectionSchema)
    .refine(
      (order) =>
        new Set(order).size === order.length &&
        (order.length === editorSectionSchema.options.length ||
          (order.length === editorSectionSchema.options.length - 1 &&
            !order.includes("languages"))),
    )
    .transform((order) => {
      if (order.includes("languages")) return order;
      const at = order.indexOf("skills") + 1;
      return [...order.slice(0, at), "languages", ...order.slice(at)];
    })
    .optional(),
  content: draftContentSchema,
  sectionTitles: z
    .partialRecord(editorSectionSchema.exclude(["personal"]), titleSchema)
    .optional(),
  experienceSources: z
    .array(librarySource.refine(({ content }) => content.kind === "experience"))
    .max(50)
    .optional(),
  librarySources: z
    .array(librarySource)
    .max(453)
    .refine(
      (sources) =>
        new Set(sources.map(({ libraryId }) => libraryId)).size ===
        sources.length,
    )
    .optional(),
  settings: z
    .record(z.string().min(1).max(100), resumeStyleSchema)
    .refine((settings) => Object.keys(settings).length <= 24),
  hidden: z.array(z.string().min(1).max(1000)).max(20_000),
  hiddenKeyVersion: z.literal(2).optional(),
  photo: picture.optional(),
  photoCrop: photoCrop.optional(),
});
const resumeDocumentSchema = resumeDocumentInputSchema.transform(
  (document, context) => {
    const hidden = normalizeHiddenKeys(document);
    if (hidden.length > 20_000) {
      context.addIssue({
        code: "custom",
        path: ["hidden"],
        message: "Too many selections.",
      });
      return z.NEVER;
    }
    return { ...document, hidden, hiddenKeyVersion: 2 };
  },
);
const resumeSummarySchema = z.object({
  id: z.uuid(),
  title: titleSchema,
  draftRevision: z.int().positive(),
  updatedAt: z.iso.datetime(),
  templateName: z.string().min(1),
  paper: z.enum(["A4", "Letter"]),
  archived: z.boolean(),
  pageCount: z.int().positive().nullable(),
});
const savedResumeSchema = resumeSummarySchema.extend({
  document: resumeDocumentSchema,
});
const checkpointSchema = z.object({
  id: z.uuid(),
  name: titleSchema,
  draftRevision: z.int().positive(),
  createdAt: z.iso.datetime(),
});

module.exports = {
  resumeFontSchema,
  resumeStyleSchema,
  resumeDocumentSchema,
  resumeSummarySchema,
  savedResumeSchema,
  titleSchema,
  checkpointSchema,
};
