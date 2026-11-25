import { randomUUID } from "node:crypto";
import {
  resumeDocumentSchema,
  type ResumeDocument,
} from "@ogma/contracts/resume-workspace";
import type { RichText } from "../../../../packages/contracts/resume-content";

const headings: Record<string, string> = {
  "work experience": "experience",
  experience: "experience",
  "professional experience": "experience",
  education: "education",
  skills: "skills",
  "technical skills": "skills",
  languages: "languages",
  projects: "projects",
  "personal projects": "projects",
  certifications: "certifications",
  summary: "summary",
  profile: "summary",
  "professional summary": "summary",
  awards: "awards",
};
const dateRange =
  /(\d{2}\/\d{4}|\d{4}(?:-\d{2})?)\s*[–—-]\s*(\d{2}\/\d{4}|\d{4}(?:-\d{2})?|present|current)/i;
const toDate = (value: string) =>
  value.includes("/")
    ? value.slice(3) + "-" + value.slice(0, 2)
    : /^\d/.test(value)
      ? value
      : "";

function richText(lines: string[]): RichText {
  return {
    type: "doc",
    content: lines.map((line) => {
      const bullet = /^[•●▪*-]\s+/.test(line);
      const paragraph = {
        type: "paragraph" as const,
        content: [
          { type: "text" as const, text: line.replace(/^[•●▪*-]\s+/, "") },
        ],
      };
      return bullet
        ? {
            type: "bulletList" as const,
            content: [
              {
                type: "listItem" as const,
                attrs: { id: randomUUID() },
                content: [paragraph],
              },
            ],
          }
        : paragraph;
    }),
  };
}

export function proposeImportedResume(
  text: string,
  links: { url: string; label: string; page: number }[],
) {
  const document: ResumeDocument = {
    schemaVersion: 1,
    layoutId: "essential",
    settings: {},
    hidden: [],
    content: {
      contact: {
        firstName: "",
        lastName: "",
        pronouns: "",
        email: "",
        phone: "",
        address: "",
        linkedin: "",
        github: "",
        website: "",
      },
      targetTitle: "",
      summary: "",
      experience: [],
      education: [],
      skills: [],
      languages: [],
      certifications: [],
      awards: [],
      projects: [],
      volunteering: [],
      publications: [],
    },
  };
  const content = document.content;
  const blankContent = structuredClone(content);
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const sections = new Map<string, string[]>();
  let section = "header";
  for (const line of lines) {
    const heading = headings[line.toLowerCase().replace(/:$/, "")];
    if (heading) {
      section = heading;
      continue;
    }
    sections.set(section, [...(sections.get(section) ?? []), line]);
  }
  const header = sections.get("header") ?? [];
  const name = header[0] ?? "";
  if (name.length <= 240 && !/[\d@/:]/.test(name)) {
    const [first, ...rest] = name.split(/\s+/);
    content.contact.firstName = first;
    content.contact.lastName = rest.join(" ");
    header.shift();
  }
  const headerText = header.join("\n");
  content.contact.email =
    headerText.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i)?.[0] ?? "";
  content.contact.phone =
    headerText.match(/\+\d[\d ()-]{6,}\d/)?.[0]?.trim() ?? "";
  const candidates = [
    ...links
      .filter(
        (link) =>
          link.page === 1 &&
          ((link.label.trim() && headerText.includes(link.label.trim())) ||
            headerText.includes(link.url)),
      )
      .map((link) => link.url),
    ...(headerText.match(
      /(?:https?:\/\/|www\.|(?:linkedin|github)\.com\/)[^\s•|]+/gi,
    ) ?? []),
  ];
  for (const candidate of candidates) {
    try {
      const url = new URL(
        /^https?:\/\//i.test(candidate) ? candidate : "https://" + candidate,
      );
      if (
        !["https:", "http:"].includes(url.protocol) ||
        url.username ||
        url.password
      )
        continue;
      const host = url.hostname.toLowerCase();
      const key =
        host === "github.com" || host.endsWith(".github.com")
          ? "github"
          : host === "linkedin.com" || host.endsWith(".linkedin.com")
            ? "linkedin"
            : "website";
      if (!content.contact[key] && url.href.length <= 240)
        content.contact[key] = url.href;
    } catch {
      /* Ambiguous links remain in the original source for review. */
    }
  }
  const contactLine = header.findIndex(
    (line) =>
      (Boolean(content.contact.email) &&
        line.includes(content.contact.email)) ||
      (Boolean(content.contact.phone) &&
        line.includes(content.contact.phone)) ||
      /(?:https?:|linkedin\.com|github\.com|www\.)/.test(line),
  );
  const headerRemainder = [...header];
  if (contactLine >= 0) {
    let end = contactLine;
    while (
      end + 1 < header.length &&
      /(?:https?:|linkedin\.com|github\.com|www\.)/.test(header[end + 1])
    )
      end++;
    const contactLines = header.slice(0, end + 1);
    const address = contactLines.join(" ").split(/[•+]/)[0].trim();
    if (
      address &&
      !address.includes("@") &&
      !/(?:https?:|\.com)/.test(address) &&
      address.length <= 240
    )
      content.contact.address = address.replace(/[|\s]+$/, "");
    headerRemainder.splice(0, end + 1);
  }
  if (headerRemainder[0]?.length <= 120)
    content.targetTitle = headerRemainder.shift() ?? "";
  content.summary = [
    ...headerRemainder,
    ...(sections.get("summary") ?? []),
  ].join("\n");
  const unmapped: string[] = [];
  const work = sections.get("experience") ?? [];
  const starts = work.flatMap((line, index) =>
    dateRange.test(line)
      ? [index > 0 && !line.replace(dateRange, "").trim() ? index - 1 : index]
      : [],
  );
  if (!starts.length && work.length)
    unmapped.push("EXPERIENCE\n" + work.join("\n"));
  for (let index = 0; index < starts.length; index++) {
    const chunk = work.slice(starts[index], starts[index + 1]);
    const dateIndex = chunk.findIndex((line) => dateRange.test(line));
    const match = chunk[dateIndex].match(dateRange);
    if (!match) continue;
    const employer = chunk[0].replace(dateRange, "").trim();
    const role = chunk[dateIndex + 1] ?? "";
    const [position, employment = ""] = role.split(/\s*[•|]\s*/);
    const employmentMatch = employment.match(
      /^(Full[- ]time|Part[- ]time|Internship|Contract|Freelance|Temporary|Self[- ]employed)(?:\s+(.+))?$/i,
    );
    const employmentType = employmentMatch?.[1] ?? employment;
    const location = chunk[dateIndex + 2] ?? "";
    const hasLocation =
      location.length < 100 &&
      !/^[•*-]|tech stack/i.test(location) &&
      location.includes(",");
    content.experience.push({
      id: randomUUID(),
      employer,
      position,
      employmentType,
      location: hasLocation ? location : (employmentMatch?.[2] ?? ""),
      startDate: toDate(match[1]),
      endDate: toDate(match[2]),
      current: /present|current/i.test(match[2]),
      description: richText(chunk.slice(dateIndex + (hasLocation ? 3 : 2))),
    });
  }
  for (const [kind, values] of sections) {
    if (["header", "summary", "experience"].includes(kind)) continue;
    if (kind === "skills") {
      const groups: string[] = [];
      for (const line of values) {
        if (line.includes(":") || !groups.length) groups.push(line);
        else groups[groups.length - 1] += " " + line;
      }
      content.skills = groups.map((line) => {
        const split = line.indexOf(":");
        return {
          id: randomUUID(),
          category: split >= 0 ? line.slice(0, split) : "",
          skills: (split >= 0 ? line.slice(split + 1) : line)
            .split(/[,;•]/)
            .map((name) => ({
              id: randomUUID(),
              name: name.trim(),
              level: "" as const,
            }))
            .filter((skill) => skill.name),
        };
      });
    } else if (kind === "projects" && values.length) {
      const starts = values.flatMap((line, index) =>
        index + 1 < values.length &&
        /^(?:personal project|freelance|open source|academic project)$/i.test(
          values[index + 1],
        )
          ? [index]
          : [],
      );
      if (!starts.length) unmapped.push("PROJECTS\n" + values.join("\n"));
      for (let index = 0; index < starts.length; index++) {
        const chunk = values.slice(starts[index], starts[index + 1]);
        content.projects.push({
          id: randomUUID(),
          name: chunk[0],
          organization: chunk[1],
          startDate: "",
          endDate: "",
          description: richText(chunk.slice(2)),
        });
      }
    } else if (kind === "languages") {
      content.languages = values
        .join(",")
        .split(/[,;•]/)
        .map((value) => ({ id: randomUUID(), name: value.trim(), level: "" }));
    } else if (kind === "education" && values.length) {
      const dates = values.join(" ").match(dateRange);
      const institution = values[1] ?? "";
      const gpa = institution.match(/GPA:\s*([\d./]+)/i);
      const institutionName = institution.split(/[•|]/)[0].trim();
      const location = gpa
        ? institution
            .slice((gpa.index ?? 0) + gpa[0].length)
            .replace(dateRange, "")
            .replace(/^[\s•|]+|[\s•|]+$/g, "")
        : "";
      content.education.push({
        id: randomUUID(),
        degree: values[0],
        university: institutionName,
        location,
        fieldOfStudy: "",
        gpa: gpa?.[1] ?? "",
        startDate: dates ? toDate(dates[1]) : "",
        endDate: dates ? toDate(dates[2]) : "",
        description: richText(
          values
            .slice(2)
            .map((line) => line.replace(dateRange, "").trim())
            .filter(Boolean),
        ),
      });
    } else {
      unmapped.push(kind.toUpperCase() + "\n" + values.join("\n"));
    }
  }
  // Oversized or ambiguous proposals stay available as plain source text.
  const parsed = resumeDocumentSchema.safeParse(document);
  if (!parsed.success) {
    document.content = blankContent;
    return { document: resumeDocumentSchema.parse(document), unmapped: text };
  }
  return { document: parsed.data, unmapped: unmapped.join("\n\n") };
}
