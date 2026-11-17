import {
  entryMetadata,
  splitEssentialMetadata,
  workEntryHeading,
  workMetadataSeparator,
} from "./entry-metadata";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  designDefaults,
  pageMargins,
  paperDimensions,
  resolveProficiency,
} from "./design-options";
import {
  contactSvg,
  entrySvg,
  portraitPlaceholderSvg,
  sectionSvg,
  workMetadataSvg,
} from "./resume-icons";
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
  resumeSkills,
  workProjectEntries,
  sectionName,
  type ResumeEntry,
} from "./resume-content";
import { resumeLayoutStyles } from "./resume-layout-styles";
import { resumeColors } from "./resume-colors";
import {
  contactHref,
  escapeText,
  renderLinkedText,
  renderLink,
} from "./resume-links";

const markElements = { bold: "strong", italic: "em", underline: "u" } as const;

function richInline(node: RichInline) {
  if (node.type === "hardBreak") return "<br>";
  return (node.marks ?? []).reduce((text, mark) => {
    const tag = markElements[mark.type];
    return `<${tag}>${text}</${tag}>`;
  }, renderLinkedText(node.text));
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
    : `<span class="portrait portrait-placeholder" aria-hidden="true">${portraitPlaceholderSvg}</span>`;
}

function contactDetails(
  details: ReturnType<typeof resumeHeader>["details"],
  showIcons: boolean,
  essential: boolean,
) {
  if (essential && !showIcons)
    return details
      .map(({ kind, value }) => renderLink(value, contactHref(kind, value)))
      .join(' <span aria-hidden="true">•</span> ');
  return details
    .map(
      ({ kind, value }) =>
        `<span>${showIcons ? `<i class="contact-icon">${contactSvg(kind)}</i>` : ""}<span>${renderLink(value, contactHref(kind, value))}</span></span>`,
    )
    .join("");
}

const levelStrength = {
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3,
  Expert: 4,
  Native: 5,
} as const;

function renderSkillMeter(
  indicator: Exclude<ReturnType<typeof resolveProficiency>, "none">,
  strength: number,
) {
  if (indicator === "bar") {
    return `<span class="skill-meter indicator-bar" aria-hidden="true"><span style="width:${strength * 20}%"></span></span>`;
  }

  const sticks = indicator === "sticks";
  const marks = Array.from({ length: 5 }, (_, index) => {
    const center = index * 10 + 5;
    const fill = index < strength ? ' class="filled"' : "";
    return sticks
      ? `<rect x="${center - 3}" y="0" width="6" height="30" rx="3"${fill}/>`
      : `<circle cx="${center}" cy="5" r="${indicator === "dots" ? 3.5 : 3.65}"${fill}/>`;
  }).join("");
  return `<svg class="skill-meter skill-meter-marks indicator-${indicator}" viewBox="0 0 50 ${sticks ? 30 : 10}" preserveAspectRatio="none" aria-hidden="true" focusable="false">${marks}</svg>`;
}

function renderSkills(
  entry: ResumeEntry,
  defaults: ReturnType<typeof designDefaults>,
  style: LayoutDraft["style"],
) {
  const skills = entry.skills ?? [];
  const mode = style.skillsLayout ?? defaults.skillsLayout;
  const indicator = resolveProficiency(style, defaults.proficiencyIndicator);
  const rated = indicator !== "none" && skills.some((skill) => skill.level);
  const anchor = `data-preview-anchor="skills:${escapeText(entry.id)}"`;
  const category = escapeText(entry.title);
  if (rated || mode === "columns" || mode === "lined") {
    const heading = category ? `<h3>${category}</h3>` : "";
    const items = skills
      .map(({ name, level }) => {
        if (!level || indicator === "none")
          return `<li><span>${escapeText(name)}</span></li>`;
        return `<li><span>${escapeText(name)}</span><span class="skill-level"><span>${escapeText(level)}</span>${renderSkillMeter(indicator, levelStrength[level])}</span></li>`;
      })
      .join("");
    const presentation = mode !== "lined" && rated ? "rated" : mode;
    return `<article class="entry skill-category-${presentation}" ${anchor}><div class="entry-copy">${heading}<ul class="skill-list" role="list">${items}</ul></div></article>`;
  }
  const label = category
    ? `<strong class="skill-category-label">${category}:</strong> `
    : "";
  const items = skills
    .map((skill) => escapeText(skill.name))
    .join(
      mode === "bullet"
        ? ' <span class="skill-separator" aria-hidden="true">&#8226;</span> '
        : ", ",
    );
  return `<article class="entry skill-category-line${mode === "list" ? " skill-category-list" : ""}" ${anchor}>
    <p>${label}${items}</p></article>`;
}

function renderProjectTable(projects: readonly ResumeEntry[]) {
  if (!projects.length) return "";
  const rows = projects
    .map(
      (entry) =>
        `<tr data-preview-anchor="projects:${escapeText(entry.id)}"><th scope="row">${renderLinkedText(entry.title)}<span class="project-context">${[
          entry.subtitle,
          entry.date,
        ]
          .filter(Boolean)
          .map((item) => renderLinkedText(item!))
          .join(
            "<br>",
          )}</span></th><td>${entry.description?.content?.map(richBlock).join("") ?? ""}</td></tr>`,
    )
    .join("");
  return `<table class="project-table"><thead><tr><th scope="col">Project name</th><th scope="col">Description</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function renderEntry(
  id: Exclude<SectionId, "summary">,
  entry: ResumeEntry,
  index: number,
  draft: LayoutDraft,
  layout: ResumeLayout,
  defaults: ReturnType<typeof designDefaults>,
) {
  const isWork = id === "experience";
  const timeline = isWork && layout.timeline;
  const essential = layout.id === "essential";
  const work =
    isWork && defaults.workExperience
      ? workEntryHeading(entry, draft.style, defaults.workExperience, timeline)
      : undefined;
  const organizationFirst =
    work?.employerFirst ?? (essential && isWork && Boolean(entry.subtitle));
  const title = renderLinkedText(
    organizationFirst ? entry.subtitle! : entry.title,
  );
  const secondary = organizationFirst ? entry.title : entry.subtitle;
  const subtitle = secondary
    ? `<p class="${isWork ? (work?.employerFirst ? "employer work-position" : "employer") : essential ? "essential-entry-subtitle" : "entry-subtitle"}">${renderLinkedText(secondary)}</p>`
    : "";
  const metadata = entryMetadata(
    entry,
    {
      ...draft.style,
      dateAlignment: draft.style.dateAlignment ?? defaults.dateAlignment,
      locationAlignment:
        draft.style.locationAlignment ?? defaults.locationAlignment,
      employmentTypeAlignment:
        draft.style.employmentTypeAlignment ?? defaults.employmentTypeAlignment,
    },
    timeline,
    essential,
  );
  const divider = `<span class="entry-separator" aria-hidden="true">${essential ? "•" : "|"}</span>`;
  const names = (
    fields: typeof metadata.left,
    separator = "",
    inline = false,
  ) =>
    fields
      .map((field, index) => {
        const { kind, text, alignment } = field;
        const icon =
          work?.showIcons && (kind === "date" || kind === "location")
            ? workMetadataSvg(kind)
            : "";
        const marker =
          work && inline ? workMetadataSeparator(fields[index - 1], field) : "";
        const prefix = marker
          ? `<span class="entry-separator" aria-hidden="true">${marker}</span>&nbsp;`
          : "";
        return `<span class="entry-${kind} metadata-${alignment}">${prefix}${icon}${escapeText(text)}</span>`;
      })
      .join(separator);
  const railFields = work?.lines.rail ?? metadata.rail;
  const rail = railFields.length
    ? `<div class="dates entry-timeline-metadata">${names(railFields)}</div>`
    : "";
  const rows = (work?.rows ?? metadata.rows)
    .map(
      (field) =>
        `<div class="dates entry-metadata-row metadata-${field.alignment}">${names([field])}</div>`,
    )
    .join("");
  const description = entry.description?.content?.length
    ? `<div class="rich-text">${entry.description.content.map(richBlock).join("")}</div>`
    : "";
  const anchor = `data-preview-anchor="${id}:${escapeText(entry.id)}"`;
  const headingTitle = title
    ? `<h3${work?.employerFirst ? ' class="work-organization"' : ""}>${title}</h3>`
    : "";
  const headingLine = (
    primary: string,
    left = metadata.left,
    right = metadata.right,
    join = divider,
    prefix = join,
  ) => {
    if (!primary && !left.length && !right.length) return "";
    return `<div class="job-heading"><div class="entry-title-line">${primary}${left.length ? `<span class="dates entry-left-metadata">${primary ? prefix : ""}${names(left, join, true)}</span>` : ""}</div>${right.length ? `<div class="dates entry-right-metadata">${names(right, join, true)}</div>` : ""}</div>`;
  };
  let lines = headingLine(headingTitle) + subtitle;
  if (work) {
    const workLine = (
      heading: string,
      fields: typeof metadata.left,
      dash = false,
    ) =>
      headingLine(
        heading,
        fields.filter((field) => field.alignment === "left"),
        fields.filter((field) => field.alignment === "right"),
        "",
        dash ? '<span class="entry-separator" aria-hidden="true">—</span>' : "",
      );
    lines =
      workLine(headingTitle, work.lines.first) +
      workLine(subtitle, work.lines.second, work.employerSeparator === "dash") +
      workLine("", work.lines.below);
  } else if (essential && (isWork || id === "education")) {
    const { left, right, secondaryLeft, secondaryRight } =
      splitEssentialMetadata(metadata, id === "education");
    lines =
      headingLine(headingTitle, left, right) +
      headingLine(subtitle, secondaryLeft, secondaryRight);
  }
  const heading = `<div class="entry-heading">${lines}${rows}</div>`;
  if (isWork) {
    const image = entry.logo ?? (index === 0 ? draft.logo : undefined);
    const logo =
      layout.logos === "none"
        ? ""
        : image
          ? `<img class="employer-logo" src="${escapeText(image)}" alt="">`
          : `<span class="employer-logo brand-${index % 4}" aria-hidden="true">${escapeText((entry.subtitle || entry.title.split(" · ").at(-1) || "").trim().charAt(0))}</span>`;
    return `<article class="job${work ? " work-experience" : ""}" ${anchor}><div class="job-copy">${heading}${description}${renderProjectTable(workProjectEntries(entry.workProjects))}</div>${rail}${logo}</article>`;
  }
  const icon = entry.icon
    ? `<i class="entry-icon">${entrySvg(entry.icon)}</i>`
    : id === "awards"
      ? '<span class="entry-bullet" aria-hidden="true"></span>'
      : "";
  return `<article class="entry" ${anchor}>${icon}<div class="entry-copy">${heading}${description}</div></article>`;
}

function renderSections(
  ids: readonly SectionId[],
  draft: LayoutDraft,
  layout: ResumeLayout,
  defaults: ReturnType<typeof designDefaults>,
  skills: { regular: ResumeEntry[]; proficiency: ResumeEntry[] },
) {
  return ids
    .flatMap((id) => {
      let body: string;
      if (id === "summary") {
        body = draft.content.summary
          .split(/\r?\n/)
          .filter((line) => line.trim())
          .map((line) => `<p>${renderLinkedText(line)}</p>`)
          .join("");
      } else if (id === "skills") {
        body = skills.regular
          .map((entry) => renderSkills(entry, defaults, draft.style))
          .join("");
      } else if (
        id === "projects" &&
        (draft.style.projectTable ?? defaults.projectTable)
      ) {
        body = renderProjectTable(
          resumeEntries(
            draft.content,
            id,
            draft.style.dateFormat ?? defaults.dateFormat,
            false,
            draft.style.dateSeparator ?? defaults.dateSeparator,
          ),
        );
      } else {
        const work = id === "experience" ? defaults.workExperience : undefined;
        const entries = resumeEntries(
          draft.content,
          id,
          (work && draft.style.workDateFormat) ??
            draft.style.dateFormat ??
            work?.dateFormat ??
            defaults.dateFormat,
          draft.style.workProjectTables ?? defaults.workProjectTables,
          (work && draft.style.workDateSeparator) ??
            draft.style.dateSeparator ??
            work?.dateSeparator ??
            defaults.dateSeparator,
        );
        body = entries
          .map((entry, index) =>
            renderEntry(id, entry, index, draft, layout, defaults),
          )
          .join("");
      }
      const icon =
        (draft.style.showSectionIcons ?? defaults.showSectionIcons)
          ? `<i class="section-icon">${sectionSvg(id)}</i>`
          : "";
      const summaryTitle =
        layout.id === "essential" && id === "summary"
          ? draft.content.targetTitle.trim()
          : "";
      const section =
        body || summaryTitle
          ? `<section class="section ${id}" data-preview-anchor="section:${id}"><h2${summaryTitle ? ' class="summary-title"' : ""}>${icon}${escapeText(summaryTitle || sectionName(id, layout))}</h2><div class="section-copy">${body || "<div></div>"}</div></section>`
          : "";
      if (id !== layout.proficiencyAfter) return [section];
      return [
        section,
        ...skills.proficiency.map(
          (group) =>
            `<section class="section proficiency" data-preview-anchor="proficiency:${escapeText(group.id)}"><h2>${escapeText(group.title)}</h2><div class="section-copy">${renderSkills({ ...group, title: "" }, defaults, { ...draft.style, skillsLayout: "columns" })}</div></section>`,
        ),
      ];
    })
    .join("");
}

const fontSources = new Map<string, string>();
const bundledFaces = {
  inter: [["Ogma Inter", "inter-variable", "100 900", "normal"]],
  poppins: [
    ["Ogma Poppins", "poppins-extra-light", "200", "normal"],
    ["Ogma Poppins", "poppins-light", "300", "normal"],
    ["Ogma Poppins", "poppins-light-italic", "300", "italic"],
    ["Ogma Poppins", "poppins-regular", "400", "normal"],
    ["Ogma Poppins", "poppins-italic", "400", "italic"],
    ["Ogma Poppins", "poppins-semibold", "600", "normal"],
    ["Ogma Poppins", "poppins-bold", "700", "normal"],
  ],
};

function fontStyles(font: LayoutDraft["style"]["font"]) {
  if (font !== "inter" && font !== "poppins") return "";
  const cached = fontSources.get(font);
  if (cached) return cached;
  const css = bundledFaces[font]
    .map(([family, filename, weight, style]) => {
      const source = readFileSync(
        resolve(__dirname, `../../../web/src/app/fonts/${filename}.woff2`),
      ).toString("base64");
      return `@font-face{font-family:"${family}";src:url(data:font/woff2;base64,${source}) format("woff2");font-weight:${weight};font-style:${style};}`;
    })
    .join("\n");
  fontSources.set(font, css);
  return css;
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
  secondaryOverride?: { size?: number; weight?: number },
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

  if (secondaryOverride) {
    const { size, weight } = secondaryOverride;
    rules.push(
      `.template-essential .essential-entry-subtitle{font-size:${toPoints(size ?? style.bodySize)};font-weight:${weight ?? style.weights?.body ?? 300}}`,
    );
  }
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
      `.resume-page .job {--job-gap:${toPoints(spacing.blocks)}} .resume-page .job + .job,.resume-page .entry + .entry,.resume-page .section-copy > p + p,.resume-page .rich-text > p + p {margin-top:${toPoints(spacing.blocks)} !important} .resume-page :is(.awards,.template-classic .certifications,.template-timeline .certifications) .section-copy,.resume-page.skill-levels:not(.two-columns) .skills .section-copy {row-gap:${toPoints(spacing.blocks)}} .resume-page :is(.awards,.template-classic .certifications,.template-timeline .certifications) .entry + .entry,.resume-page.skill-levels:not(.two-columns) .skills .entry + .entry {margin-top:0 !important}`,
    );
  if (spacing?.listItems !== undefined)
    rules.push(
      `.resume-page .section .rich-text :is(ul,ol)>li+li {margin-top:${toPoints(spacing.listItems)} !important} .resume-page .skill-list {row-gap:${toPoints(spacing.listItems)}}`,
    );
  return rules.join("\n");
}

export function renderResumeLayout(
  draft: LayoutDraft,
  layout: ResumeLayout,
  thumbnail = false,
) {
  const { content, style } = draft;
  const paper = paperDimensions(style);
  const margins = pageMargins(style, layout);
  const defaults = designDefaults(layout);
  const colors = resumeColors(layout, style.accent);
  const effectiveStyle = {
    ...style,
    headerAlignment: style.headerAlignment ?? defaults.headerAlignment,
    skillsLayout: style.skillsLayout ?? defaults.skillsLayout,
    listLineHeight: style.listLineHeight ?? layout.lineHeight,
    sizes: { ...defaults.sizes, ...style.sizes },
    weights: { ...defaults.weights, ...style.weights },
    spacing: { ...defaults.spacing, ...style.spacing },
  };
  const skills: { regular: ResumeEntry[]; proficiency: ResumeEntry[] } = {
    regular: [],
    proficiency: [],
  };
  const groups = resumeSkills(
    content,
    style.groupSkills ?? defaults.groupSkills,
  );
  for (const group of groups) {
    const separate =
      layout.proficiencyAfter &&
      group.title.trim() &&
      resolveProficiency(style, defaults.proficiencyIndicator) !== "none" &&
      group.skills?.some((skill) => skill.level);
    (separate ? skills.proficiency : skills.regular).push(group);
  }
  const toWidth = (mm: number) => `${(mm / paper.width) * 100}cqw`;
  const toPoints = (pt: number) => toWidth((pt * 25.4) / 72);
  const identity = resumeHeader(content, layout);
  const showPhoto = layout.photo !== "none" && style.showPhoto;
  const photo = showPhoto ? portrait(draft.photo) : "";
  const { main, side } = resumeColumns(layout, draft.sectionOrder);
  const headerInMain =
    layout.rail === "left" ||
    layout.header === "badge" ||
    (layout.rail === "right" && layout.photo === "rail");
  const classes = [
    "resume-page",
    "template-" + layout.id,
    colors.custom ? "custom-accent" : "",
    colors.role ? "accent-role" : "",
    colors.organizations ? "accent-organizations" : "",
    colors.headings ? "accent-section-headings" : "",
    style.font === layout.font ? "use-template-font" : "",
    "head-" + layout.header,
    "heading-" + layout.heading,
    "rail-" + layout.rail,
    showPhoto ? "photo-" + layout.photo : "",
    "portrait-" + layout.photoShape,
    layout.timeline ? "timeline" : "",
    "logos-" + layout.logos,
    side.length ? "two-columns" : "",
    "skills-layout-" + effectiveStyle.skillsLayout,
  ]
    .filter(Boolean)
    .join(" ");

  const essential = layout.id === "essential";
  const contactIcons = style.showContactIcons ?? defaults.showContactIcons;
  const contact = identity.details.length
    ? `<div class="contact${essential && !contactIcons ? " contact-inline" : ""}">${contactDetails(identity.details, contactIcons, essential)}</div>`
    : "";
  const header =
    identity.name ||
    identity.pronouns.trim() ||
    (!essential && identity.title.trim()) ||
    (contact && layout.header !== "badge") ||
    (showPhoto && layout.photo !== "rail")
      ? `<header>
    ${layout.photo === "right" || layout.photo === "top" ? photo : ""}
    <div class="identity">
      ${identity.name ? `<h1>${escapeText(identity.name)}</h1>` : ""}
      ${identity.pronouns.trim() ? `<p class="pronouns">${escapeText(identity.pronouns)}</p>` : ""}
      ${!essential && identity.title.trim() ? `<p class="role">${escapeText(identity.title)}</p>` : ""}
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
  --ink-accent:${colors.accent}; --supporting-ink:${colors.supportingInk}; --table-ink:${colors.tableInk}; --table-paper:${colors.tablePaper}; --paper:${layout.paper}; --preset-side:${layout.sideColor ?? layout.paper};
  --split:${layout.ratio}%;
  --rail-edge:${toWidth(margins.left + ((paper.width - margins.left - margins.right) * layout.ratio) / 100)};
  --margin-top:${toWidth(margins.top)}; --margin-right:${toWidth(margins.right)};
  --margin-bottom:${toWidth(margins.bottom)}; --margin-left:${toWidth(margins.left)};
  --gap:${toWidth(style.sectionGap)};
  --body:${toPoints(style.bodySize)};
  --leading:${style.lineHeight}; --font:${fontChoices[style.font].css};
  --ach-columns:${layout.achievementColumns};
  ${essential ? `--reference-point:${toPoints(1)}; --essential-summary-size:${toPoints(effectiveStyle.sizes.primary)}; --essential-summary-weight:${effectiveStyle.weights.primary}; --essential-work-gap:${toPoints(style.spacing?.blocks ?? 3.5)}; --essential-skill-gap:${toPoints(style.spacing?.blocks ?? 8)}; --essential-project-paragraph-gap:${toPoints(style.spacing?.blocks ?? 1.5)}; --essential-project-subtitle-gap:${toPoints(style.spacing?.headings ?? 1.5)};` : ""}
}
@page { size:${paper.width}mm ${paper.height}mm; margin:0 }

${resumeLayoutStyles}
${formattingRules(effectiveStyle, toPoints, style.spacing?.titleContent !== undefined, essential ? { size: style.sizes?.secondary, weight: style.weights?.secondary } : undefined)}
${fontStyles(style.font)}
${
  thumbnail
    ? `
@media screen {
  html, body { overflow:hidden; background:transparent; }
  .workspace { min-width:0; padding:0; }
  .workspace .page { width:100%; box-shadow:none; }
}
`
    : ""
}
</style></head><body><main class="workspace" data-paper-width="${paper.width}" data-paper-height="${paper.height}" data-template-name="${escapeText(layout.name)}"><div class="page"><div class="${classes}">
${headerInMain ? "" : header}
<div class="columns"><div class="column main">${headerInMain ? header : ""}${renderSections(main, { ...draft, style: effectiveStyle }, layout, defaults, skills)}</div>
${side.length ? `<aside class="column side">${layout.photo === "rail" && showPhoto ? `<div class="rail-portrait">${photo}</div>` : ""}${layout.header === "badge" && contact ? `<section class="section contact-section"><h2>${(style.showSectionIcons ?? defaults.showSectionIcons) ? `<i class="section-icon">${sectionSvg("contact")}</i>` : ""}Contact Information</h2>${contact}</section>` : ""}${renderSections(side, { ...draft, style: effectiveStyle }, layout, defaults, skills)}</aside>` : ""}
</div></div></div></main></body></html>`;
}
