import { entryMetadata, splitEssentialMetadata } from "./entry-metadata";
import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  HeadingLevel,
  ImageRun,
  LevelFormat,
  Packer,
  Paragraph,
  TextRun,
  Tab,
  Table,
  TableCell,
  TableRow,
  WidthType,
  TabStopType,
  type INumberingOptions,
} from "docx";
import type {
  RichBlock,
  RichParagraph,
  RichText,
  TextRole,
} from "../../../../packages/contracts/resume-content";
import {
  fontChoices,
  resumeColumns,
  type ResumeLayout,
} from "./layout-catalog";
import {
  designDefaults,
  pageMargins,
  paperDimensions,
  resolveProficiency,
} from "./design-options";
import type { LayoutDraft } from "./layout-draft";
import { resumeColors } from "./resume-colors";
import {
  resumeEntries,
  resumeHeader,
  resumeSkills,
  sectionName,
  workProjectEntries,
  type ResumeEntry,
} from "./resume-content";
import { contactHref } from "./resume-links";

// cspell:ignore IHDR
function image(dataUri: string, size: number) {
  const [mime, data] = dataUri.split(",");
  const png = mime.includes("png");
  const bytes = Buffer.from(data, "base64");
  const dimensions =
    png && bytes.length >= 24 && bytes.toString("ascii", 12, 16) === "IHDR"
      ? { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }
      : { width: size, height: size };
  const scale = size / Math.max(1, dimensions.width, dimensions.height);
  return new ImageRun({
    type: png ? "png" : "jpg",
    data: bytes,
    transformation: {
      width: Math.max(1, Math.round(dimensions.width * scale)),
      height: Math.max(1, Math.round(dimensions.height * scale)),
    },
  });
}

function runs(paragraph: RichParagraph) {
  return (paragraph.content ?? []).map((part) => {
    if (part.type === "hardBreak") return new TextRun({ break: 1 });
    const marks = new Set(part.marks?.map((mark) => mark.type));
    return new TextRun({
      text: part.text,
      bold: marks.has("bold"),
      italics: marks.has("italic"),
      underline: marks.has("underline") ? {} : undefined,
    });
  });
}

export function renderResumeWord(draft: LayoutDraft, layout: ResumeLayout) {
  const { content, style } = draft;
  const { name, title, pronouns, details } = resumeHeader(content, layout);
  const essential = layout.id === "essential";
  const ivyLeague = layout.heading === "center-rule";
  const colors = resumeColors(layout, style.accent);
  const accent = colors.accent.slice(1);
  const supportingInk = colors.supportingInk.slice(1);
  const paper = paperDimensions(style);
  const margins = pageMargins(style, layout);
  const mmTwips = (mm: number) => Math.round((mm * 1440) / 25.4);
  const pointTwips = (points: number | undefined) =>
    points === undefined ? undefined : Math.round(points * 20);
  const align = {
    left: AlignmentType.LEFT,
    center: AlignmentType.CENTER,
    right: AlignmentType.RIGHT,
  } as const;
  const alignment =
    align[
      style.headerAlignment ?? (layout.header === "center" ? "center" : "left")
    ];
  const defaults = designDefaults(layout);
  function typography(role: TextRole) {
    const weight = style.weights?.[role] ?? defaults.weights[role];
    const size =
      role === "body"
        ? style.bodySize
        : (style.sizes?.[role] ?? defaults.sizes[role]);
    const namedWeight =
      style.font === "inter" || style.font === "poppins"
        ? (
            {
              200: "ExtraLight",
              300: "Light",
              600: "SemiBold",
            } as Record<number, string>
          )[weight]
        : undefined;
    return {
      size: Math.round(size * 2),
      bold: !namedWeight && weight >= 600,
      font:
        fontChoices[style.font].word + (namedWeight ? ` ${namedWeight}` : ""),
    };
  }
  const { main, side } = resumeColumns(layout, draft.sectionOrder);
  const numbering: Array<INumberingOptions["config"][number]> = [];

  const skillMode = style.skillsLayout ?? defaults.skillsLayout;
  const dateFormat = style.dateFormat ?? defaults.dateFormat;
  const dateSeparator = style.dateSeparator ?? defaults.dateSeparator;
  const separator = essential ? " • " : " | ";
  const metadataStyle = {
    ...style,
    dateAlignment: style.dateAlignment ?? defaults.dateAlignment,
    locationAlignment: style.locationAlignment ?? defaults.locationAlignment,
    employmentTypeAlignment:
      style.employmentTypeAlignment ?? defaults.employmentTypeAlignment,
  };
  const proficiency = resolveProficiency(style, defaults.proficiencyIndicator);
  const farRight = mmTwips(paper.width - margins.left - margins.right);
  const categoryListRef = "skill-category-list";
  if (skillMode === "list") {
    numbering.push({
      reference: categoryListRef,
      levels: [
        {
          level: 0,
          format: LevelFormat.BULLET,
          text:
            layout.header === "center" && layout.heading === "spaced"
              ? "\u2014"
              : "\u2022",
          alignment: AlignmentType.START,
          style: {
            run: { font: typography("body").font },
            paragraph: {
              indent: {
                left: Math.round(style.bodySize * 36),
                hanging: Math.round(style.bodySize * 19),
              },
            },
          },
        },
      ],
    });
  }

  function skillParagraphs(skills: string[]): Paragraph[] {
    const spacing = {
      line: Math.round((style.listLineHeight ?? layout.lineHeight) * 240),
    };
    return skills.flatMap((first, index) => {
      if (index % 2 !== 0) return [];
      const second = skills[index + 1];
      return [
        new Paragraph({
          spacing,
          tabStops: [
            { type: TabStopType.LEFT, position: Math.round(farRight / 2) },
          ],
          children: [
            new TextRun(first),
            ...(second ? [new TextRun({ children: [new Tab(), second] })] : []),
          ],
        }),
      ];
    });
  }

  function richParagraphs(value: RichText | undefined, dash: boolean) {
    function block(node: RichBlock, depth = 0): Paragraph[] {
      if (node.type === "paragraph")
        return [
          new Paragraph({
            children: runs(node),
            spacing: { before: pointTwips(style.spacing?.blocks), after: 0 },
          }),
        ];

      const level = Math.min(depth, 8);
      const reference = "resume-list-" + numbering.length;
      numbering.push({
        reference,
        levels: [
          {
            level,
            format:
              node.type === "bulletList"
                ? LevelFormat.BULLET
                : LevelFormat.DECIMAL,
            text:
              node.type === "bulletList"
                ? dash
                  ? "\u2014"
                  : "\u2022"
                : `%${level + 1}.`,
            start: node.type === "orderedList" ? (node.attrs?.start ?? 1) : 1,
            alignment: AlignmentType.START,
            style: {
              run: { font: typography("body").font },
              paragraph: {
                indent: {
                  left: Math.round(style.bodySize * 36) + 270 * level,
                  hanging: Math.round(style.bodySize * 19),
                },
              },
            },
          },
        ],
      });
      return node.content.flatMap((item, index) => {
        const [first, ...following] = item.content;
        return [
          new Paragraph({
            children: runs(first),
            numbering: { reference, level },
            spacing: {
              line: Math.round(
                (style.listLineHeight ?? layout.lineHeight) * 240,
              ),
              before: index > 0 ? pointTwips(style.spacing?.listItems) : 0,
              after: 0,
            },
          }),
          ...following.flatMap((nested) => block(nested, depth + 1)),
        ];
      });
    }
    return value?.content?.flatMap((node) => block(node)) ?? [];
  }

  function projectTable(entries: readonly ResumeEntry[]) {
    if (!entries.length) return [];
    const widths = [32, 68];
    const heading = new TableRow({
      tableHeader: true,
      children: ["Project name", "Description"].map(
        (text, index) =>
          new TableCell({
            width: { size: widths[index], type: WidthType.PERCENTAGE },
            shading: { fill: colors.tablePaper.slice(1) },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text,
                    bold: true,
                    color: colors.tableInk.slice(1),
                  }),
                ],
              }),
            ],
          }),
      ),
    });
    const rows = entries.map((entry) => {
      const description = richParagraphs(entry.description, false);
      return new TableRow({
        children: [
          new TableCell({
            width: { size: widths[0], type: WidthType.PERCENTAGE },
            children: [
              new Paragraph(entry.title),
              ...[entry.subtitle, entry.date].flatMap((text) =>
                text ? [new Paragraph(text)] : [],
              ),
            ],
          }),
          new TableCell({
            width: { size: widths[1], type: WidthType.PERCENTAGE },
            children: description.length ? description : [new Paragraph("")],
          }),
        ],
      });
    });
    return [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [heading, ...rows],
      }),
    ];
  }

  const contents = [...main, ...side].flatMap((id) => {
    const body =
      id === "summary"
        ? content.summary
            .split(/\r?\n/)
            .filter((line) => line.trim())
            .map((text) => new Paragraph(text))
        : id === "projects" && (style.projectTable ?? defaults.projectTable)
          ? projectTable(
              resumeEntries(content, id, dateFormat, false, dateSeparator),
            )
          : (id === "skills"
              ? resumeSkills(content, style.groupSkills ?? defaults.groupSkills)
              : resumeEntries(
                  content,
                  id,
                  dateFormat,
                  style.workProjectTables ?? defaults.workProjectTables,
                  dateSeparator,
                )
            ).flatMap((entry, index) => {
              const logo = entry.logo ?? (index === 0 ? draft.logo : undefined);
              const skills =
                entry.skills?.map((skill) =>
                  proficiency !== "none" && skill.level
                    ? `${skill.name} (${skill.level})`
                    : skill.name,
                ) ?? [];
              const inlineSkills =
                id === "skills" && skillMode !== "columns" && skills.length > 0;
              const metadata = entryMetadata(
                entry,
                metadataStyle,
                id === "experience" && layout.timeline,
                essential,
              );
              const split =
                essential && (id === "experience" || id === "education")
                  ? splitEssentialMetadata(metadata, id === "education")
                  : undefined;
              const leftText = [
                ...(split?.left ?? metadata.left),
                ...metadata.rail,
              ]
                .map((field) => field.text)
                .join(separator);
              const rightText = (split?.right ?? metadata.right)
                .map((field) => field.text)
                .join(separator);
              const organizationFirst =
                essential && id === "experience" && Boolean(entry.subtitle);
              const title = (
                organizationFirst ? entry.subtitle! : entry.title
              ).trim();
              const subtitle = organizationFirst ? entry.title : entry.subtitle;
              const secondaryLeft = split?.secondaryLeft
                .map((field) => field.text)
                .join(separator);
              const secondaryRight = split?.secondaryRight
                .map((field) => field.text)
                .join(separator);
              const { rows } = metadata;
              const secondaryRole =
                essential &&
                id !== "experience" &&
                !style.sizes?.secondary &&
                !style.weights?.secondary
                  ? "body"
                  : "secondary";
              const metadataRole =
                essential && id === "experience" ? "primary" : "minor";
              const paragraphSpace = {
                before:
                  index > 0
                    ? pointTwips(
                        style.spacing?.blocks ??
                          (essential ? defaults.spacing.blocks : undefined),
                      )
                    : undefined,
              };
              return [
                ...(title || inlineSkills || leftText || rightText
                  ? [
                      new Paragraph({
                        spacing: {
                          ...paragraphSpace,
                          line: inlineSkills
                            ? Math.round(
                                (style.listLineHeight ?? layout.lineHeight) *
                                  240,
                              )
                            : undefined,
                        },
                        keepNext: Boolean(
                          subtitle ||
                          secondaryLeft ||
                          secondaryRight ||
                          rows.length ||
                          entry.description?.content?.length,
                        ),
                        tabStops: rightText
                          ? [{ type: TabStopType.RIGHT, position: farRight }]
                          : undefined,
                        numbering:
                          inlineSkills && skillMode === "list"
                            ? { reference: categoryListRef, level: 0 }
                            : undefined,
                        children: [
                          ...(id === "experience" &&
                          layout.logos !== "none" &&
                          logo
                            ? [image(logo, 20), new TextRun("  ")]
                            : []),
                          ...(title
                            ? [
                                new TextRun({
                                  text: title + (inlineSkills ? ": " : ""),
                                  color: essential ? "000000" : "26303B",
                                  ...typography("primary"),
                                }),
                              ]
                            : []),
                          ...(inlineSkills
                            ? [
                                new TextRun({
                                  text: skills.join(
                                    skillMode === "bullet" ? " \u2022 " : ", ",
                                  ),
                                  ...typography("body"),
                                }),
                              ]
                            : []),
                          ...(leftText
                            ? [
                                new TextRun({
                                  text: (title ? separator : "") + leftText,
                                  ...typography(metadataRole),
                                }),
                              ]
                            : []),
                          ...(rightText
                            ? [
                                new TextRun({
                                  children: [new Tab(), rightText],
                                  ...typography(metadataRole),
                                }),
                              ]
                            : []),
                        ],
                      }),
                    ]
                  : []),
                ...(subtitle || secondaryLeft || secondaryRight
                  ? [
                      new Paragraph({
                        spacing: {
                          before: pointTwips(style.spacing?.headings),
                        },
                        keepNext: true,
                        tabStops: secondaryRight
                          ? [{ type: TabStopType.RIGHT, position: farRight }]
                          : undefined,
                        children: [
                          ...(subtitle
                            ? [
                                new TextRun({
                                  text: subtitle,
                                  color:
                                    colors.organizations &&
                                    (id === "experience" || id === "education")
                                      ? supportingInk
                                      : undefined,
                                  ...typography(secondaryRole),
                                }),
                              ]
                            : []),
                          ...(secondaryLeft
                            ? [
                                new TextRun({
                                  text:
                                    (subtitle ? separator : "") + secondaryLeft,
                                  ...typography(metadataRole),
                                }),
                              ]
                            : []),
                          ...(secondaryRight
                            ? [
                                new TextRun({
                                  children: [new Tab(), secondaryRight],
                                  ...typography(metadataRole),
                                }),
                              ]
                            : []),
                        ],
                      }),
                    ]
                  : []),
                ...rows.map(
                  (field) =>
                    new Paragraph({
                      alignment: align[field.alignment],
                      keepNext: true,
                      children: [
                        new TextRun({
                          text: field.text,
                          ...typography("minor"),
                        }),
                      ],
                    }),
                ),
                ...(inlineSkills ? [] : skillParagraphs(skills)),
                ...richParagraphs(
                  entry.description,
                  (layout.header === "center" &&
                    layout.heading === "spaced" &&
                    id === "experience") ||
                    (layout.id === "crest-projects" && id === "projects"),
                ),
                ...(id === "experience"
                  ? projectTable(workProjectEntries(entry.workProjects))
                  : []),
              ];
            });
    const summaryTitle = essential && id === "summary" ? title.trim() : "";
    return body.length || summaryTitle
      ? [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            keepNext: true,
            alignment: ivyLeague ? AlignmentType.CENTER : undefined,
            border: colors.headingRule
              ? {
                  [colors.headingRule]: {
                    style: BorderStyle.SINGLE,
                    size: 4,
                    space: 2,
                    color: accent,
                  },
                }
              : undefined,
            spacing: {
              before:
                style.spacing?.sections === undefined
                  ? mmTwips(style.sectionGap)
                  : pointTwips(style.spacing.sections),
              after: pointTwips(
                style.spacing?.titleContent ??
                  (essential
                    ? defaults.spacing.titleContent + (summaryTitle ? 11 : 0)
                    : undefined),
              ),
            },
            children: [
              new TextRun({
                text:
                  summaryTitle ||
                  (essential
                    ? sectionName(id, layout).toUpperCase()
                    : sectionName(id, layout)),
                color: summaryTitle
                  ? "000000"
                  : colors.headings
                    ? accent
                    : "24292D",
                ...typography(summaryTitle ? "primary" : "section"),
              }),
            ],
          }),
          ...body,
        ]
      : [];
  });

  const identity = [
    ...(layout.photo !== "none" && style.showPhoto && draft.photo
      ? [
          new Paragraph({
            alignment:
              layout.photo === "top"
                ? AlignmentType.CENTER
                : AlignmentType.RIGHT,
            children: [image(draft.photo, 66)],
          }),
        ]
      : []),
    ...(name
      ? [
          new Paragraph({
            heading: HeadingLevel.TITLE,
            alignment,
            keepNext: true,
            children: [
              new TextRun({
                text: name,
                color: essential ? accent : "19222A",
                ...typography("name"),
              }),
            ],
          }),
        ]
      : []),
    ...[
      { text: pronouns, role: "minor" as const },
      { text: essential ? "" : title, role: "secondary" as const },
    ]
      .filter(({ text }) => text.trim())
      .map(
        ({ text, role }) =>
          new Paragraph({
            alignment,
            children: [
              new TextRun({
                text,
                color:
                  colors.role && role === "secondary"
                    ? supportingInk
                    : undefined,
                ...typography(role),
              }),
            ],
          }),
      ),
    ...(layout.header === "badge" && details.length
      ? [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            keepNext: true,
            children: [
              new TextRun({
                text: "Contact Information",
                color: accent,
                ...typography("section"),
              }),
            ],
          }),
        ]
      : []),
    ...(details.length
      ? [
          new Paragraph({
            alignment,
            children: details.flatMap(({ kind, value }, index) => {
              const href = contactHref(kind, value);
              const text = new TextRun({ text: value, ...typography("minor") });
              return [
                ...(index
                  ? [
                      new TextRun({
                        text: essential ? separator : " · ",
                        ...typography("minor"),
                      }),
                    ]
                  : []),
                href
                  ? new ExternalHyperlink({ link: href, children: [text] })
                  : text,
              ];
            }),
          }),
        ]
      : []),
  ];

  return Packer.toBuffer(
    new Document({
      title: name || "Resume",
      numbering: { config: numbering },
      styles: {
        default: {
          document: {
            run: typography("body"),
            paragraph: {
              spacing: { line: Math.round(style.lineHeight * 240) },
            },
          },
        },
      },
      sections: [
        {
          properties: {
            page: {
              size: {
                width: mmTwips(paper.width),
                height: mmTwips(paper.height),
              },
              margin: {
                top: mmTwips(margins.top),
                right: mmTwips(margins.right),
                bottom: mmTwips(margins.bottom),
                left: mmTwips(margins.left),
              },
            },
          },
          children: [...identity, ...contents],
        },
      ],
    }),
  );
}
