import type { ResumeDocument } from "@ogma/contracts/resume-workspace";
import { libraryContent, type LibraryValue } from "./library-content";

export function importLibraryEntries(
  document: ResumeDocument,
  ids: Map<string, string>,
) {
  const content = document.content;
  const { linkedin, github, website, ...personal } = content.contact;
  const values: LibraryValue[] = [
    ...(Object.values(personal).some(Boolean)
      ? [
          {
            kind: "personal" as const,
            value: {
              ...personal,
              targetTitle: content.targetTitle,
              photo: document.photo,
              photoCrop: document.photoCrop,
            },
          },
        ]
      : []),
    ...([linkedin, github, website].some(Boolean)
      ? [{ kind: "links" as const, value: { linkedin, github, website } }]
      : []),
    ...(content.summary.trim()
      ? [{ kind: "summary" as const, value: { summary: content.summary } }]
      : []),
    ...content.experience.map((value) => ({
      kind: "experience" as const,
      value,
    })),
    ...content.education.map((value) => ({
      kind: "education" as const,
      value,
    })),
    ...content.projects.map((value) => ({ kind: "projects" as const, value })),
    ...content.skills.map((value) => ({ kind: "skills" as const, value })),
    ...(content.languages ?? []).map((value) => ({
      kind: "languages" as const,
      value,
    })),
    ...content.certifications.map((value) => ({
      kind: "certifications" as const,
      value,
    })),
    ...content.awards.map((value) => ({ kind: "awards" as const, value })),
    ...content.volunteering.map((value) => ({
      kind: "volunteering" as const,
      value,
    })),
    ...content.publications.map((value) => ({
      kind: "publications" as const,
      value,
    })),
  ];
  return values.map((value) => {
    const key = value.kind + ("id" in value.value ? "/" + value.value.id : "");
    const id = ids.get(key) ?? crypto.randomUUID();
    ids.set(key, id);
    return {
      id,
      entryId: "id" in value.value ? value.value.id : id,
      content: libraryContent(value),
    };
  });
}
