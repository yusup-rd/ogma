import { entryMetadata } from "./entry-metadata";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { designDefaults, pageMargins, paperDimensions } from "./design-options";
import type {
  RichBlock,
  RichInline,
} from "../../../../packages/contracts/resume-content";
import {
  fontChoices,
  resumeColumns,
  type ResumeLayout,
  type SectionId,
} from "./layout-catalog";
import type { LayoutDraft } from "./layout-draft";
import {
  resumeEntries,
  resumeHeader,
  sectionNames,
  type ResumeEntry,
} from "./resume-content";
import { resumeLayoutStyles } from "./resume-layout-styles";

const entities: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeText(text: string) {
  return text.replace(/[&<>"']/g, (character) => entities[character]);
}

const markElements = { bold: "strong", italic: "em", underline: "u" } as const;

function richInline(node: RichInline) {
  if (node.type === "hardBreak") return "<br>";
  return (node.marks ?? []).reduce((text, mark) => {
    const tag = markElements[mark.type];
    return `<${tag}>${text}</${tag}>`;
  }, escapeText(node.text));
}

function richBlock(node: RichBlock): string {
  if (node.type === "paragraph") {
    return `<p>${node.content?.map(richInline).join("") || "<br>"}</p>`;
  }

  const tag = node.type === "orderedList" ? "ol" : "ul";
  const start =
    node.type === "orderedList" && node.attrs?.start
      ? ` start="${node.attrs.start}"`
      : "";
  return `<${tag}${start}>${node.content.map((item) => `<li>${item.content.map(richBlock).join("")}</li>`).join("")}</${tag}>`;
}

function portrait(src?: string) {
  return src
    ? `<img class="portrait" src="${escapeText(src)}" alt="">`
    : '<span class="portrait portrait-placeholder" aria-hidden="true"></span>';
}

const contactIcons: Record<string, string> = {
  email: "✉",
  phone: "✆",
  address: "⌖",
  linkedin: "↗",
  website: "↗",
  github: "↗",
};

function contactDetails(details: ReturnType<typeof resumeHeader>["details"]) {
  return details
    .map(
      ({ kind, value }) =>
        `<span><i aria-hidden="true">${contactIcons[kind]}</i><span>${escapeText(value)}</span></span>`,
    )
    .join("");
}

const levelStrength = {
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3,
  Expert: 4,
} as const;

function renderSkills(
  entry: ResumeEntry,
  layout: ResumeLayout,
  style: LayoutDraft["style"],
) {
  const skills = entry.skills ?? [];
  const mode = style.skillsLayout ?? designDefaults(layout).skillsLayout;
  const anchor = `data-preview-anchor="skills:${escapeText(entry.id)}"`;
  const category = escapeText(entry.title);
  const label = category
    ? `<strong class="skill-category-label">${category}:</strong> `
    : "";
  if (mode === "columns") {
    const heading = category ? `<h3>${category}</h3>` : "";
    const items = skills
      .map((skill) => {
        const level = layout.showSkillLevels && skill.level;
        return `<li><span>${escapeText(skill.name)}</span>${
          level
            ? `<span class="skill-level"><span class="skill-meter" aria-hidden="true"><span style="width:${levelStrength[level] * 25}%"></span></span>${escapeText(level)}</span>`
            : ""
        }</li>`;
      })
      .join("");
    return `<article class="entry skill-category-columns" ${anchor}><div class="entry-copy">${heading}<ul class="skill-list" role="list">${items}</ul></div></article>`;
  }
  const values = skills.map((skill) =>
    escapeText(
      skill.name +
        (layout.showSkillLevels && skill.level ? " (" + skill.level + ")" : ""),
    ),
  );
  const items = values.join(
    mode === "bullet"
      ? ' <span class="skill-separator" aria-hidden="true">•</span> '
      : ", ",
  );
  return `<article class="entry skill-category-line${mode === "list" ? " skill-category-list" : ""}" ${anchor}${mode === "list" ? ' role="listitem"' : ""}>
    <p>${label}${items}</p></article>`;
}

const entryIcons = ["✦", "◆", "●", "↗"];

function renderEntry(
  id: Exclude<SectionId, "summary">,
  entry: ResumeEntry,
  index: number,
  draft: LayoutDraft,
  layout: ResumeLayout,
) {
  const isWork = id === "experience";
  const timeline = isWork && layout.timeline;
  const title = escapeText(entry.title);
  const subtitle = entry.subtitle
    ? `<p class="${isWork ? "employer" : "entry-subtitle"}">${escapeText(entry.subtitle)}</p>`
    : "";
  if (id === "skills") return renderSkills(entry, layout, draft.style);
  const metadata = entryMetadata(entry, draft.style, timeline);
  const divider = '<span class="entry-separator">|</span>';
  const names = (fields: typeof metadata.left, separator = "") =>
    fields
      .map(
        ({ kind, text }) =>
          `<span class="entry-${kind}">${escapeText(text)}</span>`,
      )
      .join(separator);
  const left = metadata.left.length
    ? `<span class="dates entry-left-metadata">${title ? divider : ""}${names(metadata.left, divider)}</span>`
    : "";
  const right = metadata.right.length
    ? `<div class="dates entry-right-metadata">${names(metadata.right, divider)}</div>`
    : "";
  const rail = timeline
    ? `<div class="dates entry-timeline-metadata">${names(metadata.rail)}</div>`
    : "";
  const rows = metadata.rows
    .map(
      (field) =>
        `<div class="dates entry-metadata-row metadata-${field.alignment}">${names([field])}</div>`,
    )
    .join("");
  const description = entry.description?.content?.length
    ? `<div class="rich-text">${entry.description.content.map(richBlock).join("")}</div>`
    : "";
  const anchor = `data-preview-anchor="${id}:${escapeText(entry.id)}"`;
  const heading = `<div class="entry-heading"><div class="job-heading">
    <div class="entry-title-line">${title ? `<h3>${title}</h3>` : ""}${left}</div>${right}
  </div>${subtitle}${rows}</div>`;
  if (isWork) {
    const logo =
      layout.logos === "none"
        ? ""
        : index === 0 && draft.logo
          ? `<img class="employer-logo" src="${escapeText(draft.logo)}" alt="">`
          : `<span class="employer-logo brand-${index % 4}" aria-hidden="true">${escapeText(entry.title.split(" · ").at(-1)?.trim().charAt(0) ?? "")}</span>`;
    return `<article class="job" ${anchor}><div class="job-copy">${heading}${description}</div>${rail}${logo}</article>`;
  }
  const icon =
    id === "awards"
      ? `<i class="entry-icon" aria-hidden="true">${entryIcons[index % entryIcons.length]}</i>`
      : "";
  return `<article class="entry" ${anchor}>${icon}<div class="entry-copy">${heading}${description}</div></article>`;
}

const sectionIcons: Partial<Record<SectionId, string>> = {
  summary: "♟",
  experience: "▣",
  awards: "⚑",
  skills: "◆",
  education: "▰",
  certifications: "▤",
  projects: "▦",
  volunteering: "✦",
  publications: "▧",
};

function renderSections(
  ids: readonly SectionId[],
  draft: LayoutDraft,
  layout: ResumeLayout,
) {
  return ids
    .map((id) => {
      const body =
        id === "summary"
          ? draft.content.summary
              .split(/\r?\n/)
              .filter((line) => line.trim())
              .map((line) => `<p>${escapeText(line)}</p>`)
              .join("")
          : resumeEntries(draft.content, id, draft.style.dateFormat)
              .map((entry, index) =>
                renderEntry(id, entry, index, draft, layout),
              )
              .join("");
      if (!body) return "";
      const icon = sectionIcons[id]
        ? `<i class="section-icon" aria-hidden="true">${sectionIcons[id]}</i>`
        : "";
      const isSkillList =
        id === "skills" && draft.style.skillsLayout === "list";
      return `<section class="section ${id}" data-preview-anchor="section:${id}"><h2>${icon}${sectionNames[id]}</h2><div class="section-copy"${isSkillList ? ' role="list"' : ""}>${body}</div></section>`;
    })
    .join("");
}

let interSource: string | undefined;

function fontStyles(font: LayoutDraft["style"]["font"]) {
  if (font !== "inter") return "";
  interSource ??= readFileSync(
    resolve(__dirname, "../../../web/src/app/fonts/inter-variable.woff2"),
  ).toString("base64");
  return `@font-face{font-family:"Ogma Inter";src:url(data:font/woff2;base64,${interSource}) format("woff2");font-weight:100 900;}`;
}

const roleSelectors = {
  body: ".resume-page",
  primary: ".resume-page .column .section h3",
  secondary:
    ".resume-page .role,.resume-page .section .entry-subtitle,.resume-page .section .employer",
  section: ".resume-page .column .section h2",
  name: ".resume-page header h1",
  minor:
    ".resume-page .contact,.resume-page .pronouns,.resume-page .section .dates,.resume-page .section .skill-level",
};

function formattingRules(
  style: LayoutDraft["style"],
  toPoints: (value: number) => string,
  titleContentOverride: boolean,
) {
  const alignment = style.headerAlignment;
  const rules = Object.entries(roleSelectors).flatMap(([key, selector]) => {
    const role = key as keyof typeof roleSelectors;
    const size = role === "body" ? undefined : style.sizes?.[role];
    const weight = style.weights?.[role];
    return size === undefined && weight === undefined
      ? []
      : [
          `${selector}{${size === undefined ? "" : `font-size:${toPoints(size)} !important;`}${weight === undefined ? "" : `font-weight:${weight} !important;`}}`,
        ];
  });

  if (alignment) {
    const justify =
      alignment === "center"
        ? "center"
        : alignment === "right"
          ? "flex-end"
          : "flex-start";
    rules.push(
      `.resume-page header {text-align:${alignment}} .resume-page header .contact {justify-content:${justify}}`,
    );
  }
  if (style.listLineHeight !== undefined)
    rules.push(
      `.resume-page .rich-text li,.resume-page .rich-text li p,.resume-page .skill-list li {line-height:${style.listLineHeight}}`,
    );
  const spacing = style.spacing;
  if (spacing?.sections !== undefined)
    rules.push(
      `.resume-page .column .section:not(:last-child),.resume-page header {margin-bottom:${toPoints(spacing.sections)} !important}`,
    );
  if (spacing?.titleContent !== undefined)
    rules.push(
      `.resume-page .column .section h2 {margin-bottom:${toPoints(spacing.titleContent)} !important}${titleContentOverride ? ` .resume-page .rich-text {margin-top:${toPoints(spacing.titleContent)}}` : ""}`,
    );
  if (spacing?.headings !== undefined)
    rules.push(
      `.resume-page .section .entry-subtitle,.resume-page .section .employer,.resume-page .identity .role {margin-top:${toPoints(spacing.headings)} !important}`,
    );
  if (spacing?.blocks !== undefined)
    rules.push(
      `.resume-page .job {--job-gap:${toPoints(spacing.blocks)}} .resume-page .job + .job,.resume-page .entry + .entry,.resume-page .section-copy > p + p,.resume-page .rich-text > * + * {margin-top:${toPoints(spacing.blocks)} !important} .resume-page :is(.awards,.template-classic .certifications,.template-timeline .certifications) .section-copy,.resume-page.skill-levels:not(.two-columns) .skills .section-copy {row-gap:${toPoints(spacing.blocks)}} .resume-page :is(.awards,.template-classic .certifications,.template-timeline .certifications) .entry + .entry,.resume-page.skill-levels:not(.two-columns) .skills .entry + .entry {margin-top:0 !important}`,
    );
  if (spacing?.listItems !== undefined)
    rules.push(
      `.resume-page .section .rich-text :is(ul,ol)>li+li {margin-top:${toPoints(spacing.listItems)} !important} .resume-page .skill-list {row-gap:${toPoints(spacing.listItems)}}`,
    );
  return rules.join("\n");
}

export function renderResumeLayout(draft: LayoutDraft, layout: ResumeLayout) {
  const { content, style } = draft;
  const paper = paperDimensions(style);
  const margins = pageMargins(style);
  const defaults = designDefaults(layout);
  const effectiveStyle = {
    ...style,
    dateFormat: style.dateFormat ?? defaults.dateFormat,
    headerAlignment: style.headerAlignment ?? defaults.headerAlignment,
    skillsLayout: style.skillsLayout ?? defaults.skillsLayout,
    listLineHeight: style.listLineHeight ?? layout.lineHeight,
    sizes: { ...defaults.sizes, ...style.sizes },
    weights: { ...defaults.weights, ...style.weights },
    spacing: { ...defaults.spacing, ...style.spacing },
  };
  const toWidth = (mm: number) => `${(mm / paper.width) * 100}cqw`;
  const toPoints = (pt: number) => toWidth((pt * 25.4) / 72);
  const identity = resumeHeader(content);
  const showPhoto = layout.photo !== "none" && style.showPhoto;
  const photo = showPhoto ? portrait(draft.photo) : "";
  const { main, side } = resumeColumns(layout, draft.sectionOrder);
  const headerInMain = layout.rail === "left" || layout.header === "badge";
  const classes = [
    "resume-page",
    "template-" + layout.id,
    "head-" + layout.header,
    "heading-" + layout.heading,
    "rail-" + layout.rail,
    showPhoto ? "photo-" + layout.photo : "",
    "portrait-" + layout.photoShape,
    layout.timeline ? "timeline" : "",
    "logos-" + layout.logos,
    side.length ? "two-columns" : "",
    layout.showSkillLevels ? "skill-levels" : "",
    "skills-layout-" + effectiveStyle.skillsLayout,
  ]
    .filter(Boolean)
    .join(" ");

  const contact = identity.details.length
    ? `<div class="contact">${contactDetails(identity.details)}</div>`
    : "";
  const header =
    identity.name ||
    identity.pronouns.trim() ||
    identity.title.trim() ||
    (contact && layout.header !== "badge") ||
    (showPhoto && layout.photo !== "rail")
      ? `<header>
    ${layout.photo === "right" || layout.photo === "top" ? photo : ""}
    <div class="identity">
      ${identity.name ? `<h1>${escapeText(identity.name)}</h1>` : ""}
      ${identity.pronouns.trim() ? `<p class="pronouns">${escapeText(identity.pronouns)}</p>` : ""}
      ${identity.title.trim() ? `<p class="role">${escapeText(identity.title)}</p>` : ""}
    </div>
    ${layout.header === "badge" ? "" : contact}
  </header>`
      : "";

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:">
<title>${escapeText(identity.name || "Resume preview")}</title>
<style>
html { --paper-width:${paper.width}; --paper-height:${paper.height}; }
.resume-page {
  --accent:${style.accent}; --paper:${layout.paper}; --side:${layout.sideColor ?? layout.paper};
  --split:${layout.ratio}%;
  --margin-top:${toWidth(margins.top)}; --margin-right:${toWidth(margins.right)};
  --margin-bottom:${toWidth(margins.bottom)}; --margin-left:${toWidth(margins.left)};
  --gap:${toWidth(style.sectionGap)};
  --body:${toPoints(style.bodySize)};
  --leading:${style.lineHeight}; --font:${fontChoices[style.font].css};
  --ach-columns:${layout.achievementColumns};
}
@page { size:${paper.width}mm ${paper.height}mm; margin:0 }

${resumeLayoutStyles}
${formattingRules(effectiveStyle, toPoints, style.spacing?.titleContent !== undefined)}
${fontStyles(style.font)}
</style></head><body><main class="workspace" data-paper-width="${paper.width}" data-paper-height="${paper.height}" data-template-name="${escapeText(layout.name)}"><div class="page"><div class="${classes}">
${headerInMain ? "" : header}
<div class="columns"><div class="column main">${headerInMain ? header : ""}${renderSections(main, { ...draft, style: effectiveStyle }, layout)}</div>
${side.length ? `<aside class="column side">${layout.photo === "rail" && showPhoto ? `<div class="rail-portrait">${photo}</div>` : ""}${layout.header === "badge" && contact ? `<section class="section contact-section"><h2><i class="section-icon" aria-hidden="true">✉</i>Contact Information</h2>${contact}</section>` : ""}${renderSections(side, { ...draft, style: effectiveStyle }, layout)}</aside>` : ""}
</div></div></div></main></body></html>`;
}
