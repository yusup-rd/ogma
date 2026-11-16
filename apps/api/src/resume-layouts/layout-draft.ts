import {
  draftContentSchema,
  field,
  picture,
} from "@ogma/contracts/resume-content-schema";
import { resumeStyleSchema } from "@ogma/contracts/resume-workspace";
import { z } from "zod";
import type { DraftContent } from "../../../../packages/contracts/resume-content";
import { upgradeResumeContent } from "./upgrade-resume-content";
import { getResumeLayout, sectionIds } from "./layout-catalog";

const contentSchema = draftContentSchema.transform((content): DraftContent => {
  const jobs = new Map(content.experience.map((job) => [job.id, job]));
  const projects = content.projects.flatMap(({ workEntryId, ...project }) => {
    const job = workEntryId ? jobs.get(workEntryId) : undefined;
    if (!job) return [project];
    if (!job.projects?.some(({ id }) => id === project.id)) {
      const context = [project.organization, project.startDate, project.endDate]
        .filter(Boolean)
        .join(" · ");
      job.projects = [
        ...(job.projects ?? []),
        {
          id: project.id,
          name: project.name,
          description: context
            ? {
                type: "doc",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: context }],
                  },
                  ...(project.description.content ?? []),
                ],
              }
            : project.description,
        },
      ];
    }
    return [];
  });
  return { ...content, projects };
});

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

export const layoutDraftSchema = z.object({
  layoutId: z
    .string()
    .refine((value) => Boolean(getResumeLayout(value)), "Unknown template"),
  sectionOrder: z.array(z.enum(sectionIds)).max(sectionIds.length).optional(),
  content: z.union([contentSchema, previousContentSchema]),
  style: resumeStyleSchema,
  photo: picture.optional(),
  logo: picture.optional(),
});

export type LayoutDraft = z.infer<typeof layoutDraftSchema>;
