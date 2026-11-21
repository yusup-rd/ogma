import type { PhotoCrop } from "@ogma/contracts/resume-content-schema";
import {
  librarySections,
  type LibraryEntryContent,
  type LibraryKind,
} from "@ogma/contracts/content-library";
import type {
  AwardEntry,
  CertificationEntry,
  ContactInformation,
  EducationEntry,
  EntryIcon,
  ProjectEntry,
  PublicationEntry,
  RichText,
  Skill,
  SkillCategory,
  SkillLevel,
  VolunteerEntry,
  WorkEntry,
} from "../../../../../packages/contracts/resume-content";

export const linkFields = ["linkedin", "github", "website"] as const;
export type LinkFields = Pick<ContactInformation, (typeof linkFields)[number]>;
export type PersonalFields = Omit<ContactInformation, keyof LinkFields> & {
  targetTitle: string;
  photo?: string;
  photoCrop?: PhotoCrop;
};

export type LibraryValue =
  | { kind: "personal"; value: PersonalFields }
  | { kind: "links"; value: LinkFields }
  | { kind: "summary"; value: { summary: string } }
  | { kind: "experience"; value: WorkEntry }
  | { kind: "education"; value: EducationEntry }
  | { kind: "projects"; value: ProjectEntry }
  | { kind: "skills"; value: SkillCategory }
  | { kind: "languages"; value: Skill }
  | { kind: "certifications"; value: CertificationEntry }
  | { kind: "awards"; value: AwardEntry }
  | { kind: "volunteering"; value: VolunteerEntry }
  | { kind: "publications"; value: PublicationEntry };

const skillLevels: SkillLevel[] = [
  "",
  "Beginner",
  "Intermediate",
  "Advanced",
  "Expert",
  "Native",
];
const icons: EntryIcon[] = [
  "award",
  "graduation",
  "star",
  "target",
  "chart",
  "book",
  "heart",
  "building",
];

function description(content: LibraryEntryContent): RichText {
  if (content.description) return content.description;
  if (content.bullets?.length) {
    return {
      type: "doc",
      content: [
        {
          type: "bulletList",
          content: content.bullets.map(({ id, text }) => ({
            type: "listItem",
            attrs: { id },
            content: [{ type: "paragraph", content: [{ type: "text", text }] }],
          })),
        },
      ],
    };
  }
  return {
    type: "doc",
    content:
      content.details?.split(/\r?\n/).map((text) => ({
        type: "paragraph",
        ...(text && { content: [{ type: "text", text }] }),
      })) ?? [],
  };
}

export function libraryValue(
  id: string,
  content: LibraryEntryContent,
): LibraryValue {
  const { kind, fields } = content;
  const text = (key: string) => fields[key] ?? "";
  const range = { startDate: text("startDate"), endDate: text("endDate") };
  const icon = icons.find((item) => item === fields.icon);
  const level =
    skillLevels.find(
      (item) => item.toLowerCase() === text("level").toLowerCase(),
    ) ?? "";
  switch (kind) {
    case "personal":
      return {
        kind,
        value: {
          firstName: text("firstName"),
          lastName: text("lastName"),
          pronouns: text("pronouns"),
          email: text("email"),
          phone: text("phone"),
          address: text("address"),
          targetTitle: text("targetTitle"),
          photo: content.photo,
          photoCrop: content.photoCrop,
        },
      };
    case "links": {
      const value = {
        linkedin: text("linkedin"),
        github: text("github"),
        website: text("website"),
      };
      if (fields.url) {
        const host = URL.parse(fields.url)?.hostname.toLowerCase() ?? "";
        const key =
          host === "linkedin.com" || host.endsWith(".linkedin.com")
            ? "linkedin"
            : host === "github.com" || host.endsWith(".github.com")
              ? "github"
              : "website";
        if (!value[key]) value[key] = fields.url;
      }
      return { kind, value };
    }
    case "summary":
      return { kind, value: { summary: content.summary ?? "" } };
    case "experience":
      return {
        kind,
        value: {
          id,
          ...range,
          position: text("position"),
          employer: text("employer"),
          location: text("location"),
          employmentType: text("employmentType"),
          current: content.current ?? false,
          endDate: content.current ? "" : range.endDate,
          description: description(content),
          logo: content.logo,
          projects: content.projects ?? [],
        },
      };
    case "education":
      return {
        kind,
        value: {
          id,
          ...range,
          icon,
          university: text("university"),
          degree: text("degree"),
          fieldOfStudy: text("fieldOfStudy"),
          location: text("location"),
          gpa: text("gpa"),
          description: description(content),
        },
      };
    case "projects":
      return {
        kind,
        value: {
          id,
          ...range,
          name: text("name"),
          organization: text("organization"),
          description: description(content),
        },
      };
    case "skills":
      return {
        kind,
        value: {
          id,
          category: text("category"),
          skills:
            content.skills ??
            (fields.name
              ? [{ id: "skill-" + id, name: fields.name, level }]
              : []),
        },
      };
    case "languages":
      return { kind, value: { id, name: text("name"), level } };
    case "certifications":
      return {
        kind,
        value: { id, ...range, name: text("name"), provider: text("provider") },
      };
    case "awards":
      return {
        kind,
        value: {
          id,
          name: text("name"),
          organization: text("organization"),
          date: text("date"),
          icon,
        },
      };
    case "volunteering":
      return {
        kind,
        value: {
          id,
          ...range,
          organization: text("organization"),
          involvement: text("involvement"),
          city: text("city"),
          state: text("state"),
          description: description(content),
        },
      };
    case "publications":
      return {
        kind,
        value: {
          id,
          name: text("name"),
          publisher: text("publisher"),
          date: text("date"),
          description: description(content),
        },
      };
  }
}

export function libraryContent(draft: LibraryValue): LibraryEntryContent {
  const { kind, value } = draft;
  const fields = Object.fromEntries(
    Object.keys(librarySections[kind].fields).flatMap((key) => {
      const field = Object.entries(value).find(([name]) => name === key)?.[1];
      return typeof field === "string" ? [[key, field]] : [];
    }),
  );
  switch (kind) {
    case "personal":
      return { kind, fields, photo: value.photo, photoCrop: value.photoCrop };
    case "summary":
      return { kind, fields, summary: value.summary };
    case "experience":
      return {
        kind,
        fields,
        description: value.description,
        logo: value.logo,
        current: value.current,
        projects: value.projects?.filter(
          ({ name, description }) =>
            name.trim() || richTextLines(description).length,
        ),
      };
    case "skills":
      return {
        kind,
        fields,
        skills: value.skills
          .map((skill) => ({ ...skill, name: skill.name.trim() }))
          .filter(({ name }) => name),
      };
    case "education":
    case "projects":
    case "volunteering":
    case "publications":
      return { kind, fields, description: value.description };
    default:
      return { kind, fields };
  }
}

export function richTextLines(value: RichText): string[] {
  return (value.content ?? []).flatMap((block): string[] =>
    block.type === "paragraph"
      ? (block.content ?? [])
          .map((node) => (node.type === "hardBreak" ? "\n" : node.text))
          .join("")
          .trim()
          .split("\n")
          .filter(Boolean)
      : block.content.flatMap((item) =>
          richTextLines({ type: "doc", content: item.content }),
        ),
  );
}

export function libraryTitle(content: LibraryEntryContent) {
  const { kind, fields } = content;
  switch (kind) {
    case "personal":
      return (
        [fields.firstName, fields.lastName].filter(Boolean).join(" ") ||
        librarySections[kind].label
      );
    case "summary":
      return librarySections[kind].label;
    case "experience":
      return fields.position || fields.employer;
    case "education":
      return fields.university || fields.degree;
    case "skills":
      return fields.category || fields.name;
    case "links":
      return fields.name || librarySections[kind].label;
    case "volunteering":
      return fields.involvement || fields.organization;
    default:
      return fields.name;
  }
}

export function librarySubtitle(content: LibraryEntryContent) {
  const { kind, fields } = content;
  if (kind === "experience") {
    return [
      fields.position && fields.employer,
      [fields.startDate, content.current ? "Present" : fields.endDate]
        .filter(Boolean)
        .join(" – "),
    ]
      .filter(Boolean)
      .join(" · ");
  }
  if (kind === "skills" && content.skills)
    return content.skills.map(({ name }) => name).join(", ");
  if (kind === "education") return fields.degree;
  if (kind === "links")
    return [
      fields.linkedin && "LinkedIn",
      fields.github && "GitHub",
      fields.website && "Website",
      fields.url,
    ]
      .filter(Boolean)
      .join(" · ");
  return (
    fields.organization || fields.provider || fields.level || fields.publisher
  );
}

export function blankLibraryValue(kind: LibraryKind, id: string) {
  return libraryValue(id, { kind, fields: {} });
}
