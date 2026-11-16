import type {
  DateFormat,
  DraftContent,
  EntryIcon,
  RichBlock,
  RichText,
  Skill,
  WorkProject,
} from "../../../../packages/contracts/resume-content";
import type { SectionId } from "./layout-catalog";

export const sectionNames: Record<SectionId, string> = {
  summary: "Professional Summary",
  experience: "Work Experience",
  education: "Education",
  skills: "Skills and Interests",
  certifications: "Certifications",
  awards: "Awards and Scholarships",
  projects: "Projects",
  volunteering: "Volunteering and Leadership",
  publications: "Publications",
};

export interface ResumeEntry {
  id: string;
  title: string;
  subtitle?: string;
  metadata?: string[];
  date?: string;
  location?: string;
  employmentType?: string;
  description?: RichText;
  skills?: Skill[];
  icon?: EntryIcon;
  logo?: string;
  workProjects?: WorkProject[];
}

const month = new Intl.DateTimeFormat("en", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const day = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const longMonth = new Intl.DateTimeFormat("en", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function dateLabel(value: string, format?: DateFormat) {
  if (value.length < 7) return value;
  if (format === "year") return value.slice(0, 4);
  if (format === "numeric") return value.slice(5, 7) + "/" + value.slice(0, 4);
  const monthDate = new Date(value.slice(0, 7) + "-01T00:00:00Z");
  if (format === "short") return month.format(monthDate);
  if (format === "long") return longMonth.format(monthDate);
  if (value.length === 10) return day.format(new Date(value + "T00:00:00Z"));
  return month.format(monthDate);
}

function hasText(block: RichBlock): boolean {
  return block.type === "paragraph"
    ? Boolean(
        block.content?.some((part) => part.type === "text" && part.text.trim()),
      )
    : block.content.some((item) => item.content.some(hasText));
}

export function resumeHeader(content: DraftContent) {
  const { contact, targetTitle } = content;
  const details = [
    { kind: "email", value: contact.email },
    { kind: "phone", value: contact.phone },
    { kind: "address", value: contact.address },
    { kind: "linkedin", value: contact.linkedin },
    { kind: "website", value: contact.website },
    { kind: "github", value: contact.github },
  ] as const;
  return {
    name: [contact.firstName.trim(), contact.lastName.trim()]
      .filter(Boolean)
      .join(" "),
    title: targetTitle,
    pronouns: contact.pronouns,
    details: details.filter((detail) => detail.value.trim()),
  };
}

export function resumeEntries(
  content: DraftContent,
  id: Exclude<SectionId, "summary">,
  format?: DateFormat,
  showWorkProjects = false,
): ResumeEntry[] {
  const dateRange = (start: string, end: string, current = false) =>
    [dateLabel(start, format), current ? "Present" : dateLabel(end, format)]
      .filter(Boolean)
      .join(" \u2013 ");
  let entries: ResumeEntry[];
  switch (id) {
    case "experience":
      entries = content.experience.map((job) => ({
        id: job.id,
        title: job.position,
        subtitle: job.employer,
        employmentType: job.employmentType,
        location: job.location,
        date: dateRange(job.startDate, job.endDate, job.current),
        description: job.description,
        logo: job.logo,
        workProjects: showWorkProjects
          ? job.projects?.filter(
              (project) =>
                project.name.trim() ||
                project.description.content?.some(hasText),
            )
          : undefined,
      }));
      break;
    case "education":
      entries = content.education.map((education) => ({
        id: education.id,
        title: education.degree,
        subtitle: education.university,
        metadata: [
          education.fieldOfStudy,

          education.gpa.trim() ? "GPA " + education.gpa : "",
        ],
        location: education.location,
        date: dateRange(education.startDate, education.endDate),
        description: education.description,
        icon: education.icon,
      }));
      break;
    case "skills":
      entries = content.skills.map((category) => ({
        id: category.id,
        title: category.category,
        skills: category.skills.filter((skill) => skill.name.trim()),
      }));
      break;
    case "certifications":
      entries = content.certifications.map((certification) => ({
        id: certification.id,
        title: certification.name,
        subtitle: certification.provider,
        date: dateRange(certification.startDate, certification.endDate),
      }));
      break;
    case "awards":
      entries = content.awards.map((award) => ({
        id: award.id,
        title: award.name,
        subtitle: award.organization,
        date: dateLabel(award.date, format),
        icon: award.icon,
      }));
      break;
    case "projects":
      entries = content.projects.map((project) => ({
        id: project.id,
        title: project.name,
        subtitle: project.organization,
        date: dateRange(project.startDate, project.endDate),
        description: project.description,
      }));
      break;
    case "volunteering":
      entries = content.volunteering.map((volunteer) => ({
        id: volunteer.id,
        title: volunteer.involvement,
        subtitle: volunteer.organization,
        location: [volunteer.city, volunteer.state]
          .filter((value) => value.trim())
          .join(", "),
        date: dateRange(volunteer.startDate, volunteer.endDate),
        description: volunteer.description,
      }));
      break;
    case "publications":
      entries = content.publications.map((publication) => ({
        id: publication.id,
        title: publication.name,
        subtitle: publication.publisher,
        date: dateLabel(publication.date, format),
        description: publication.description,
      }));
      break;
  }

  return entries
    .map((entry) => ({
      ...entry,
      metadata: entry.metadata?.filter((value) => value.trim()),
    }))
    .filter(
      (entry) =>
        entry.title.trim() ||
        entry.subtitle?.trim() ||
        entry.metadata?.length ||
        entry.location?.trim() ||
        entry.employmentType?.trim() ||
        entry.date ||
        entry.skills?.length ||
        entry.workProjects?.length ||
        entry.description?.content?.some(hasText),
    );
}

export function resumeSkills(content: DraftContent, showGroups: boolean) {
  const entries = resumeEntries(content, "skills");
  if (showGroups) return entries;
  const skills = entries.flatMap((entry) => entry.skills ?? []);
  return skills.length ? [{ id: entries[0].id, title: "", skills }] : [];
}

export function workProjectEntries(
  projects: readonly WorkProject[] = [],
): ResumeEntry[] {
  return projects.map(({ id, name, description }) => ({
    id,
    title: name,
    description,
  }));
}
