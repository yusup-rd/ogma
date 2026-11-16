import type {
  DraftContent,
  ResumeSectionId,
  RichBlock,
  RichListItem,
  RichText,
} from "../../../../../packages/contracts/resume-content";
import type { TemplateOption } from "./resume-layout-model";

export const sectionTitles = {
  personal: "Personal details",
  summary: "Professional Summary",
  experience: "Work Experience",
  education: "Education",
  skills: "Skills and Interests",
  certifications: "Certifications",
  awards: "Awards and Scholarships",
  projects: "Projects",
  volunteering: "Volunteering and Leadership",
  publications: "Publications",
} satisfies Record<"personal" | ResumeSectionId, string>;

export type EditorSectionId = keyof typeof sectionTitles;

const bodySections = (Object.keys(sectionTitles) as EditorSectionId[]).filter(
  (id): id is ResumeSectionId => id !== "personal",
);

export function defaultSectionOrder(
  template: TemplateOption | null,
): EditorSectionId[] {
  if (!template) return ["personal", ...bodySections];
  const missing = bodySections.filter(
    (id) => !template.main.includes(id) && !template.side.includes(id),
  );
  const body = [...template.main, ...missing, ...template.side].filter(
    (id) => id !== "summary",
  );
  return ["personal", "summary", ...body];
}

export const sectionKey = (id: EditorSectionId) => "section/" + id;
export const entryKey = (id: string) => "entry/" + id;

const bulletKey = (entryId: string, bulletId: string) =>
  "bullet/" + entryId + "/" + bulletId;

export function withBulletIds(content: DraftContent): DraftContent {
  function identify(block: RichBlock): RichBlock {
    if (block.type === "paragraph") return block;
    return {
      ...block,
      content: block.content.map((item): RichListItem => {
        const [paragraph, ...children] = item.content;
        return {
          ...item,
          attrs: {
            id:
              item.attrs?.id ??
              crypto.getRandomValues(new Uint32Array(4)).join("-"),
          },
          content: [paragraph, ...children.map(identify)],
        };
      }),
    };
  }
  const identifyEntries = <T extends { description: RichText }>(entries: T[]) =>
    entries.map((entry) => ({
      ...entry,
      description: {
        ...entry.description,
        content: entry.description.content?.map(identify),
      },
    }));
  return {
    ...content,
    experience: identifyEntries(content.experience),
    education: identifyEntries(content.education),
    projects: identifyEntries(content.projects),
    volunteering: identifyEntries(content.volunteering),
    publications: identifyEntries(content.publications),
  };
}

export function descriptionBullets(description: RichText, entryId: string) {
  const items: { key: string; label: string }[] = [];
  function visit(block: RichBlock) {
    if (block.type === "paragraph") return;
    block.content.forEach((item) => {
      const label = item.content[0].content
        ?.map((part) => (part.type === "text" ? part.text : " "))
        .join("")
        .trim();
      const id = item.attrs?.id;
      if (label && id) items.push({ key: bulletKey(entryId, id), label });
      item.content.forEach(visit);
    });
  }
  description.content?.forEach(visit);
  return items;
}

function visibleDescription(
  value: RichText,
  entryId: string,
  hidden: ReadonlySet<string>,
): RichText {
  function filter(block: RichBlock): RichBlock | null {
    if (block.type === "paragraph") return block;
    const content = block.content.flatMap((item): RichListItem[] => {
      const id = item.attrs?.id;
      if (id && hidden.has(bulletKey(entryId, id))) return [];
      const [paragraph, ...children] = item.content;
      return [
        {
          ...item,
          content: [
            paragraph,
            ...children.flatMap((child) => {
              const result = filter(child);
              return result ? [result] : [];
            }),
          ],
        },
      ];
    });
    return content.length ? { ...block, content } : null;
  }
  return {
    ...value,
    content: value.content?.flatMap((block) => {
      const result = filter(block);
      return result ? [result] : [];
    }),
  };
}

export function visibleResume(
  content: DraftContent,
  hidden: ReadonlySet<string>,
): DraftContent {
  if (!hidden.size) return content;
  const entries = <T extends { id: string }>(
    id: ResumeSectionId,
    values: T[],
  ) =>
    hidden.has(sectionKey(id))
      ? []
      : values.filter((entry) => !hidden.has(entryKey(entry.id)));
  const described = <T extends { id: string; description: RichText }>(
    id: ResumeSectionId,
    values: T[],
  ) =>
    entries(id, values).map((entry) => ({
      ...entry,
      description: visibleDescription(entry.description, entry.id, hidden),
    }));
  const hidePersonal = hidden.has(sectionKey("personal"));
  const contact = { ...content.contact };
  for (const key of Object.keys(contact) as (keyof typeof contact)[]) {
    if (hidePersonal || hidden.has("contact/" + key)) contact[key] = "";
  }
  return {
    contact,
    targetTitle:
      hidePersonal || hidden.has("contact/targetTitle")
        ? ""
        : content.targetTitle,
    summary: hidden.has(sectionKey("summary")) ? "" : content.summary,
    experience: described("experience", content.experience),
    education: described("education", content.education),
    skills: entries("skills", content.skills).map((category) => ({
      ...category,
      skills: entries("skills", category.skills),
    })),
    certifications: entries("certifications", content.certifications),
    awards: entries("awards", content.awards),
    projects: described("projects", content.projects),
    volunteering: described("volunteering", content.volunteering),
    publications: described("publications", content.publications),
  };
}
