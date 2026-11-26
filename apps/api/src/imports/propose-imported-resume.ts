import { randomUUID } from "node:crypto";
import {
  resumeDocumentSchema,
  type ResumeDocument,
} from "@ogma/contracts/resume-workspace";
import type {
  RichText,
  Skill,
  SkillLevel,
} from "../../../../packages/contracts/resume-content";

const languageHeading =
  /^(?:languages?|spoken languages|language proficiency|языки)$/iu;
const languageLevels: [SkillLevel, RegExp][] = [
  [
    "Native",
    /^(?:native(?: speaker| proficiency| or bilingual(?: proficiency)?)?|mother tongue|bilingual(?: proficiency)?)$/i,
  ],
  ["Expert", /^(?:expert|mastery|near native|c2)$/i],
  [
    "Advanced",
    /^(?:advanced|fluent|professional(?: working| proficiency| working proficiency)?|full professional(?: proficiency)?|proficient|c1)$/i,
  ],
  [
    "Intermediate",
    /^(?:intermediate|upper intermediate|conversational|working(?: proficiency)?|limited working(?: proficiency)?|b[12])$/i,
  ],
  ["Beginner", /^(?:beginner|basic|elementary(?: proficiency)?|a[12])$/i],
];

function importedLanguageLevel(value: string): SkillLevel {
  const label = value.trim().replace(/[-_]/g, " ").replace(/\s+/g, " ");
  if (/[^\p{ASCII}]/u.test(label)) return "";
  const cefr = label.match(/\b[abc][12]\b/i)?.[0];
  return (
    languageLevels.find(([, pattern]) => pattern.test(cefr ?? label))?.[0] ?? ""
  );
}

function importedLanguages(lines: string[]): Skill[] {
  const languages: Skill[] = [];
  for (const item of lines.flatMap((line) => line.split(/[,;•|]/))) {
    const value = item.replace(/^[\s•●▪*-]+/, "").trim();
    if (!value) continue;
    const parts = value.match(
      /^(.*?)\s*(?:\(([^()]*)\)|\[([^\]]*)\]|\s+-\s+(.+)|\s*[:–—]\s*(.+))$/u,
    );
    let name = (parts?.[1] ?? value).trim();
    let level = importedLanguageLevel(
      parts ? (parts[2] ?? parts[3] ?? parts[4] ?? parts[5]) : "",
    );
    if (!parts) {
      const suffix = value.match(
        /^(.*?)\s+(native|fluent|beginner|intermediate|advanced|expert|[abc][12])$/i,
      );
      if (suffix) {
        name = suffix[1].trim();
        level = importedLanguageLevel(suffix[2]);
      }
    }
    const previous = languages.at(-1);
    const standaloneLevel = importedLanguageLevel(value);
    if (previous && !previous.level && (!name || standaloneLevel)) {
      previous.level = level || standaloneLevel;
      continue;
    }
    if (!name) continue;
    const existing = languages.find(
      (language) => language.name.toLowerCase() === name.toLowerCase(),
    );
    if (existing) existing.level ||= level;
    else languages.push({ id: randomUUID(), name, level });
  }
  return languages;
}

const headings: Record<string, string> = {
  "work experience": "experience",
  experience: "experience",
  "professional experience": "experience",
  education: "education",
  skills: "skills",
  "technical skills": "skills",
  languages: "languages",
  language: "languages",
  "spoken languages": "languages",
  "language proficiency": "languages",
  языки: "languages",
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
  const appendSectionLine = (key: string, line: string) => {
    const existing = sections.get(key);
    if (existing) existing.push(line);
    else sections.set(key, [line]);
  };
  for (const line of lines) {
    const inlineLanguages = line.match(
      /^(languages?|spoken languages|language proficiency|языки)\s*:\s*(.+)$/iu,
    );
    if (inlineLanguages && section !== "skills") {
      section = "languages";
      appendSectionLine(section, inlineLanguages[2]);
      continue;
    }
    const heading = headings[line.toLowerCase().replace(/:$/, "")];
    if (heading) {
      section = heading;
      continue;
    }
    appendSectionLine(section, line);
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
      .map((link) => ({ url: link.url, label: link.label })),
    ...(
      headerText.match(
        /(?:https?:\/\/|www\.|(?:linkedin|github)\.com\/)[^\s•|]+/gi,
      ) ?? []
    ).map((url) => ({ url, label: "" })),
  ];
  const mappedContactTokens = new Set<string>([
    content.contact.email,
    content.contact.phone,
  ]);
  const wholeLineContactTokens = new Map<string, Set<string>>();
  const addMappedContactToken = (token: string, sourceLine?: string) => {
    if (!token) return;
    mappedContactTokens.add(token);
    if (!sourceLine || !/[•|]/.test(token)) return;
    const wholeLineTokens = wholeLineContactTokens.get(sourceLine) ?? new Set();
    wholeLineTokens.add(token);
    wholeLineContactTokens.set(sourceLine, wholeLineTokens);
  };
  for (const { url: candidate, label } of candidates) {
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
      if (!content.contact[key] && url.href.length <= 240) {
        content.contact[key] = url.href;
        addMappedContactToken(
          candidate,
          header.find((line) => line.includes(candidate)),
        );
        if (label)
          addMappedContactToken(
            label,
            header.find((line) => line.includes(label)),
          );
      }
    } catch {
      /* Ambiguous links remain in the original source for review. */
    }
  }
  const addressLine = header.find((line) =>
    /^(?:address|location)\s*:\s*.+$/i.test(line),
  );
  const labeledAddress = addressLine?.match(
    /^(?:address|location)\s*:\s*(.+)$/i,
  )?.[1];
  const labeledAddressFragments =
    labeledAddress?.split(/[•|]/).map((fragment) => fragment.trim()) ?? [];
  const explicitAddress = labeledAddressFragments[0];
  if (addressLine && explicitAddress && explicitAddress.length <= 240) {
    content.contact.address = explicitAddress;
    addMappedContactToken(explicitAddress);
    const prefix =
      addressLine.match(/^(?:address|location)\s*:\s*/i)?.[0] ?? "";
    const wholeLineTokens =
      wholeLineContactTokens.get(addressLine) ?? new Set();
    wholeLineTokens.add(prefix + explicitAddress);
    wholeLineContactTokens.set(addressLine, wholeLineTokens);
  } else {
    const contactLine = header.find((line) =>
      [...mappedContactTokens].some((token) => token && line.includes(token)),
    );
    const fragments =
      contactLine?.split(/[•|]/).map((fragment) => fragment.trim()) ?? [];
    const contactFragments = new Set(
      fragments.flatMap((fragment, index) =>
        [...mappedContactTokens].some(
          (token) => token && fragment.includes(token),
        )
          ? [index]
          : [],
      ),
    );
    const addressCandidates = fragments.filter(
      (fragment, index) =>
        (contactFragments.has(index - 1) || contactFragments.has(index + 1)) &&
        fragment.includes(",") &&
        fragment.length <= 240 &&
        /\p{L}/u.test(fragment) &&
        !/[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:https?:\/\/|www\.)|\+?\d[\d ()-]{6,}\d/i.test(
          fragment,
        ) &&
        ![...mappedContactTokens].some(
          (token) => token && fragment.includes(token),
        ),
    );
    const inlineAddress =
      addressCandidates.length === 1 ? addressCandidates[0] : undefined;
    if (inlineAddress && !content.contact.address) {
      content.contact.address = inlineAddress;
      addMappedContactToken(inlineAddress, contactLine);
    }
  }
  const headerRemainder = header
    .map((line) => {
      let remainder = line;
      for (const token of wholeLineContactTokens.get(line) ?? []) {
        const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        remainder = remainder.replace(new RegExp(escaped, "giu"), " ");
      }
      return remainder
        .split(/([•|])/)
        .map((fragment) => {
          if (fragment === "•" || fragment === "|") return fragment;
          let remainder = fragment;
          for (const token of mappedContactTokens) {
            if (!token || !fragment.includes(token)) continue;
            const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            remainder = remainder.replace(new RegExp(escaped, "giu"), " ");
          }
          return remainder;
        })
        .join("")
        .replace(/^[\s•|,;:–—-]+|[\s•|,;:–—-]+$/g, "")
        .replace(/\s+[•|]\s+/g, " ")
        .trim();
    })
    .filter(Boolean);
  if (headerRemainder[0]?.length <= 120)
    content.targetTitle = headerRemainder.shift() ?? "";
  content.summary = [
    ...headerRemainder,
    ...(sections.get("summary") ?? []),
  ].join("\n");
  const unmapped: string[] = [];
  const work = sections.get("experience") ?? [];
  const starts = [
    ...new Set(
      work.flatMap((line, index) =>
        dateRange.test(line)
          ? [
              index > 0 && !line.replace(dateRange, "").trim()
                ? index - 1
                : index,
            ]
          : [],
      ),
    ),
  ];
  if (!starts.length && work.length)
    unmapped.push("EXPERIENCE\n" + work.join("\n"));
  for (let index = 0; index < starts.length; index++) {
    const chunk = work.slice(starts[index], starts[index + 1]);
    const dateIndex = chunk.findIndex((line) => dateRange.test(line));
    const match = chunk[dateIndex]?.match(dateRange);
    const employer = chunk[0]?.replace(dateRange, "").trim() ?? "";
    const role = chunk[dateIndex + 1] ?? "";
    if (!match || !employer || !role) {
      if (chunk.length) unmapped.push("EXPERIENCE\n" + chunk.join("\n"));
      continue;
    }
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
  const languageLines: string[] = [];
  for (const [kind, values] of sections) {
    if (["header", "summary", "experience"].includes(kind)) continue;
    if (kind === "skills") {
      const groups: string[] = [];
      for (const line of values) {
        if (line.includes(":") || !groups.length) groups.push(line);
        else groups[groups.length - 1] += " " + line;
      }
      content.skills = groups.flatMap((line) => {
        const split = line.indexOf(":");
        if (split >= 0 && languageHeading.test(line.slice(0, split).trim())) {
          languageLines.push(line.slice(split + 1));
          return [];
        }
        return [
          {
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
          },
        ];
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
      languageLines.push(...values);
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
  content.languages = importedLanguages(languageLines);
  // Oversized or ambiguous proposals stay available as plain source text.
  const parsed = resumeDocumentSchema.safeParse(document);
  if (!parsed.success) {
    document.content = blankContent;
    return { document: resumeDocumentSchema.parse(document), unmapped: text };
  }
  return { document: parsed.data, unmapped: unmapped.join("\n\n") };
}
