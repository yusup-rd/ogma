import type {
  ResumeSectionId,
  RichBlock,
  RichText,
} from "../../../../../packages/contracts/resume-content";
import { bulletKey } from "@ogma/contracts/resolve-resume";
import type { TemplateOption } from "./resume-layout-model";
export { sectionKey, entryKey } from "@ogma/contracts/resolve-resume";

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
