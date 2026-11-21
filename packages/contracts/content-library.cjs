const { z } = require("zod");
const {
  draftContentSchema,
  picture,
  photoCrop,
} = require("./resume-content-schema.cjs");

const librarySections = {
  personal: {
    label: "Personal details",
    fields: {
      firstName: "First name",
      lastName: "Last name",
      email: "Email",
      phone: "Phone",
      address: "Location",
      pronouns: "Pronouns",
      targetTitle: "Target title",
    },
  },
  summary: { label: "Professional summary", fields: {} },
  experience: {
    label: "Experience",
    fields: {
      employer: "Company",
      position: "Role",
      location: "Location",
      employmentType: "Employment type",
      startDate: "Start date",
      endDate: "End date",
    },
  },
  education: {
    label: "Education",
    fields: {
      university: "School",
      degree: "Degree",
      fieldOfStudy: "Field of study",
      location: "Location",
      gpa: "GPA",
      icon: "Education icon",
      startDate: "Start date",
      endDate: "End date",
    },
  },
  projects: {
    label: "Projects",
    fields: {
      name: "Project name",
      organization: "Organization",
      startDate: "Start date",
      endDate: "End date",
    },
  },
  skills: {
    label: "Skills",
    fields: { name: "Skill", category: "Category", level: "Proficiency" },
  },
  certifications: {
    label: "Certifications",
    fields: {
      name: "Certification",
      provider: "Issuer",
      startDate: "Issue date",
      endDate: "Expiry date",
    },
  },
  languages: {
    label: "Languages",
    fields: { name: "Language", level: "Proficiency" },
  },
  links: {
    label: "Links",
    fields: {
      linkedin: "LinkedIn",
      github: "GitHub",
      website: "Website or portfolio",
      name: "Label",
      url: "URL",
    },
  },
  awards: {
    label: "Awards and scholarships",
    fields: {
      name: "Award name",
      organization: "Organization",
      date: "Date earned",
      icon: "Award icon",
    },
  },
  volunteering: {
    label: "Volunteering and leadership",
    fields: {
      organization: "Organization",
      involvement: "Involvement",
      city: "City",
      state: "State",
      startDate: "Start date",
      endDate: "End date",
    },
  },
  publications: {
    label: "Publications",
    fields: { name: "Publication name", publisher: "Publisher", date: "Date" },
  },
};

const libraryKindSchema = z.enum(Object.keys(librarySections));
const bullet = z.object({
  id: z.uuid(),
  text: z.string().trim().min(1).max(2000),
});
const date = draftContentSchema.shape.experience.element.shape.startDate;
const work = draftContentSchema.shape.experience.element.shape;
const skillList = draftContentSchema.shape.skills.element.shape.skills;
const entryIcon = draftContentSchema.shape.education.element.shape.icon;
const descriptionKinds = new Set([
  "experience",
  "education",
  "projects",
  "volunteering",
  "publications",
]);
const singletonLibraryKinds = ["personal", "summary", "links"];
const revision = z.int().min(1).max(2_147_483_646);
const details = z.string().trim().max(4000);
const libraryEntryContentSchema = z
  .object({
    kind: libraryKindSchema,
    fields: z.record(z.string(), z.string().trim().max(240)),
    details: details.optional(),
    summary: z.string().trim().max(8000).optional(),
    description: work.description.optional(),
    photo: picture.optional(),
    photoCrop: photoCrop.optional(),
    logo: work.logo,
    projects: work.projects,
    skills: skillList.optional(),
    current: z.boolean().optional(),
    bullets: z.array(bullet).max(50).optional(),
  })
  .superRefine((content, context) => {
    const { kind, fields, bullets, current } = content;
    const allowed = librarySections[kind].fields;
    if (Object.keys(fields).some((key) => !Object.hasOwn(allowed, key))) {
      context.addIssue({
        code: "custom",
        path: ["fields"],
        message: "Unknown entry field.",
      });
    }
    const primary = {
      experience: fields.position || fields.employer,
      education: fields.university || fields.degree,
      links: fields.url || fields.linkedin || fields.github || fields.website,
      personal: Object.values(fields).some(Boolean) || content.photo,
      summary: content.summary,
      skills: content.skills
        ? fields.category && content.skills.some(({ name }) => name.trim())
        : fields.name,
      volunteering: fields.organization || fields.involvement,
    };
    const hasTitle = Object.hasOwn(primary, kind) ? primary[kind] : fields.name;
    if (!hasTitle) {
      context.addIssue({
        code: "custom",
        path: ["fields"],
        message: "Enter the main details for this entry.",
      });
    }
    for (const key of ["startDate", "endDate", "date"]) {
      if (!date.safeParse(fields[key] ?? "").success) {
        context.addIssue({
          code: "custom",
          path: ["fields", key],
          message: "Enter a valid date using YYYY, YYYY-MM, or YYYY-MM-DD.",
        });
      }
    }
    if (
      kind === "links" &&
      fields.url &&
      !z.url({ protocol: /^https?$/ }).safeParse(fields.url).success
    ) {
      context.addIssue({
        code: "custom",
        path: ["fields", "url"],
        message: "Use a full http or https URL.",
      });
    }
    if (fields.icon && !entryIcon.safeParse(fields.icon).success) {
      context.addIssue({
        code: "custom",
        path: ["fields", "icon"],
        message: "Choose an available icon.",
      });
    }
    for (const [key, value] of Object.entries({
      photo: content.photo,
      photoCrop: content.photoCrop,
      logo: content.logo,
      projects: content.projects,
      skills: content.skills,
      description: content.description,
      summary: content.summary,
    })) {
      const owner = {
        photo: "personal",
        photoCrop: "personal",
        logo: "experience",
        projects: "experience",
        skills: "skills",
        summary: "summary",
      }[key];
      if (
        value !== undefined &&
        (owner ? owner !== kind : !descriptionKinds.has(kind))
      ) {
        context.addIssue({
          code: "custom",
          path: [key],
          message: "This content does not belong in this section.",
        });
      }
    }
    if (
      content.skills &&
      new Set(content.skills.map(({ id }) => id)).size !== content.skills.length
    ) {
      context.addIssue({
        code: "custom",
        path: ["skills"],
        message: "Skill IDs must be unique.",
      });
    }
    if (
      kind !== "experience" &&
      (bullets !== undefined || current !== undefined)
    ) {
      context.addIssue({
        code: "custom",
        message: "Bullets and current roles belong to Experience.",
      });
    }
    if (
      bullets &&
      new Set(bullets.map(({ id }) => id)).size !== bullets.length
    ) {
      context.addIssue({
        code: "custom",
        path: ["bullets"],
        message: "Bullet IDs must be unique.",
      });
    }
  });

const libraryEntrySchema = z.object({
  id: z.uuid(),
  revision,
  archived: z.boolean(),
  updatedAt: z.iso.datetime(),
  content: libraryEntryContentSchema,
});
const libraryListSchema = z.array(libraryEntrySchema);
// List identities are required on writes so every new bullet can stay unchecked on sync.
// Keep reads compatible with older stored descriptions.
const libraryWriteContentSchema = libraryEntryContentSchema.superRefine(
  (content, context) => {
    function check(description, path) {
      const seen = new Set();
      function visit(blocks) {
        for (const block of blocks ?? []) {
          if (block.type === "paragraph") continue;
          for (const item of block.content) {
            const id = item.attrs?.id;
            if (!id || seen.has(id))
              context.addIssue({
                code: "custom",
                path,
                message: "Every list item needs a unique ID.",
              });
            if (id) seen.add(id);
            visit(item.content);
          }
        }
      }
      visit(description?.content);
    }
    check(content.description, ["description"]);
    for (const [index, project] of (content.projects ?? []).entries())
      check(project.description, ["projects", index, "description"]);
  },
);
const createLibraryEntrySchema = z.object({
  id: z.uuid(),
  content: libraryWriteContentSchema,
});
const updateLibraryEntrySchema = z.object({
  expectedRevision: revision,
  content: libraryWriteContentSchema,
});
const archiveLibraryEntrySchema = z.object({
  expectedRevision: revision,
  archived: z.boolean(),
});
const deleteLibraryEntrySchema = z.object({ expectedRevision: revision });
const libraryStatusSchema = z.object({ hasEntries: z.boolean() });

module.exports = {
  librarySections,
  singletonLibraryKinds,
  libraryEntrySchema,
  libraryEntryContentSchema,
  libraryListSchema,
  createLibraryEntrySchema,
  updateLibraryEntrySchema,
  archiveLibraryEntrySchema,
  libraryStatusSchema,
  deleteLibraryEntrySchema,
};
