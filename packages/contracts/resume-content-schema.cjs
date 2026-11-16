const { z } = require("zod");

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
const entryIcon = z.enum([
  "award",
  "graduation",
  "star",
  "target",
  "chart",
  "book",
  "heart",
  "building",
]);

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

function richBlock(depth) {
  if (!depth) return paragraph;
  const item = z.object({
    type: z.literal("listItem"),
    attrs: z.object({ id: id.optional() }).optional(),
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
const workProject = z.object({ id, name: field, description });
const draftContentSchema = z.object({
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
        employer: field.optional(),
        description,
        location: field,
        employmentType: field,
        ...range,
        current: z.boolean(),
        logo: picture.max(20_000).optional(),
        projects: z.array(workProject).max(50).optional(),
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
        icon: entryIcon.optional(),
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
                "Native",
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
    .array(
      z.object({
        id,
        name: field,
        organization: field,
        date,
        icon: entryIcon.optional(),
      }),
    )
    .max(50),
  projects: z
    .array(
      z.object({
        id,
        name: field,
        organization: field,
        ...range,
        description,
        workEntryId: id.optional(),
      }),
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
});

module.exports = { draftContentSchema, field, picture };
