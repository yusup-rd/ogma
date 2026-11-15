import type {
  ContactInformation,
  DraftContent,
  RichText,
} from "../../../../packages/contracts/resume-content";

export interface PreviousResumeContent {
  name: string;
  role: string;
  contact: string;
  summary: string;
  experience: {
    title: string;
    dates: string;
    details: string;
    projects?: string;
  }[];
  achievements: string;
  strengths: string;
  skills: string;
  education: string;
  training: string;
  languages: string;
  projects: string;
  focus: string;
}

function lines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function description(value: string, bullets = false): RichText {
  const paragraphs = lines(value).map((text) => ({
    type: "paragraph" as const,
    content: [{ type: "text" as const, text }],
  }));
  return {
    type: "doc",
    content:
      bullets && paragraphs.length
        ? [
            {
              type: "bulletList",
              content: paragraphs.map((paragraph) => ({
                type: "listItem",
                content: [paragraph],
              })),
            },
          ]
        : paragraphs,
  };
}

function split(value: string) {
  const [title, ...remaining] = value.split(" · ");
  return [title, remaining.join(" · ")];
}

function previousContact(name: string, details: string): ContactInformation {
  const [firstName = "", ...last] = name.trim().split(/\s+/);
  const contact: ContactInformation = {
    firstName,
    lastName: last.join(" "),
    pronouns: "",
    email: "",
    linkedin: "",
    address: "",
    phone: "",
    website: "",
    github: "",
  };
  for (const detail of details
    .split(" · ")
    .map((value) => value.trim())
    .filter(Boolean)) {
    if (detail.includes("@") && !contact.email) contact.email = detail;
    else if (/linkedin\.com/i.test(detail) && !contact.linkedin)
      contact.linkedin = detail;
    else if (/github\.com/i.test(detail) && !contact.github)
      contact.github = detail;
    else if (/^\+?[\d(][\d()\s-]{5,}$/.test(detail) && !contact.phone)
      contact.phone = detail;
    else if (/^(?:https?:\/\/|\S+\.\S+$)/.test(detail) && !contact.website)
      contact.website = detail;
    else
      contact.address = [contact.address, detail].filter(Boolean).join(" · ");
  }
  return contact;
}

export function upgradeResumeContent(
  previous: PreviousResumeContent,
): DraftContent {
  const projects = [
    ...lines(previous.projects),
    ...previous.experience.flatMap((job) => lines(job.projects ?? "")),
  ];
  return {
    contact: previousContact(previous.name, previous.contact),
    targetTitle: previous.role,
    summary: previous.summary,
    experience: previous.experience.map((job, index) => {
      const [period, location] = split(job.dates);
      const [startDate, endDate = ""] = period.split(/\s+[–—-]\s+/, 2);
      const isYear = (value: string) =>
        /^\d{4}$/.test(value) && value !== "0000";
      const current = endDate.toLowerCase() === "present";
      const fits =
        (!startDate || isYear(startDate)) &&
        (!endDate || current || isYear(endDate));
      return {
        id: "previous-work-" + index,
        position: job.title,
        location,
        employmentType: "",
        startDate: fits ? startDate : "",
        endDate: fits && !current ? endDate : "",
        current: fits && current,
        description: description(
          fits ? job.details : [period, job.details].filter(Boolean).join("\n"),
          true,
        ),
      };
    }),
    education: lines(previous.education).map((text, index) => {
      const [degree, university] = split(text);
      return {
        id: "previous-education-" + index,
        university,
        degree,
        fieldOfStudy: "",
        location: "",
        gpa: "",
        startDate: "",
        endDate: "",
        description: description(""),
      };
    }),
    skills: [
      ["Skills", previous.skills],
      ["Languages", previous.languages],
      ["Interests", previous.focus],
    ].flatMap(([category, value], index) => {
      const skills = lines(value).map((name, order) => ({
        id: `previous-skill-${index}-${order}`,
        name,
        level: "" as const,
      }));
      return skills.length
        ? [{ id: "previous-category-" + index, category, skills }]
        : [];
    }),
    certifications: lines(previous.training).map((text, index) => {
      const [name, provider] = split(text);
      return {
        id: "previous-certification-" + index,
        name,
        provider,
        startDate: "",
        endDate: "",
      };
    }),
    awards: [...lines(previous.achievements), ...lines(previous.strengths)].map(
      (name, index) => ({
        id: "previous-award-" + index,
        name,
        organization: "",
        date: "",
      }),
    ),
    projects: projects.map((value, index) => {
      const [name, text] = split(value);
      return {
        id: "previous-project-" + index,
        name,
        organization: "",
        startDate: "",
        endDate: "",
        description: description(text),
      };
    }),
    volunteering: [],
    publications: [],
  };
}
