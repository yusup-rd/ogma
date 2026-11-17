import type {
  DesignOptions,
  SideAlignment,
  WorkExperienceDefaults,
  WorkMetadataPlacement,
} from "../../../../packages/contracts/resume-content";
import type { ResumeEntry } from "./resume-content";

type MetadataKind = "location" | "employment-type" | "date" | "detail";
interface MetadataField {
  kind: MetadataKind;
  text: string;
  alignment: SideAlignment;
  newLine?: boolean;
}

export function workMetadataSeparator(
  previous: MetadataField | undefined,
  current: MetadataField,
) {
  return previous?.kind === "location" && current.kind === "employment-type"
    ? "•"
    : "";
}

export function workEntryHeading(
  entry: ResumeEntry,
  style: DesignOptions,
  defaults: WorkExperienceDefaults,
  timeline: boolean,
) {
  const employerFirst =
    (style.workHeadingOrder ?? defaults.order) === "employer-first" &&
    Boolean(entry.subtitle?.trim());
  const lines: Record<
    Exclude<WorkMetadataPlacement, "own-line">,
    MetadataField[]
  > = {
    first: [],
    second: [],
    below: [],
    rail: [],
  };
  const rows: MetadataField[] = [];
  const fields = [
    [
      "date",
      entry.date,
      defaults.date,
      style.dateAlignment,
      style.workDatePlacement,
      style.dateNewLine,
    ],
    [
      "location",
      entry.location,
      defaults.location,
      style.locationAlignment,
      style.workLocationPlacement,
      style.locationNewLine,
    ],
    [
      "employment-type",
      entry.employmentType,
      defaults.employmentType,
      style.employmentTypeAlignment,
      style.workEmploymentTypePlacement,
      style.employmentTypeNewLine,
    ],
  ] as const;
  for (const [kind, value, position, alignment, placement, newLine] of fields) {
    const text = value?.trim();
    if (!text) continue;
    const field = { kind, text, alignment: alignment ?? position.alignment };
    const target = placement ?? (newLine ? "own-line" : position.placement);
    if (target === "own-line") {
      rows.push(field);
      continue;
    }
    // Older documents could move timeline fields out of the rail by aligning right.
    const useRail = timeline && (placement === "rail" || alignment !== "right");
    lines[target === "rail" && !useRail ? "first" : target].push(field);
  }
  return {
    employerFirst,
    lines,
    rows,
    showIcons: style.showWorkMetadataIcons ?? defaults.icons,
    employerSeparator: defaults.employerSeparator,
  };
}

export function entryMetadata(
  entry: ResumeEntry,
  style: DesignOptions,
  timeline: boolean,
  essential = false,
) {
  const fallback = timeline ? "left" : "right";
  const fields: MetadataField[] = [
    {
      kind: "location",
      text: entry.location?.trim() ?? "",
      alignment: style.locationAlignment ?? fallback,
      newLine: style.locationNewLine,
    },
    {
      kind: "employment-type",
      text: entry.employmentType?.trim() ?? "",
      alignment: style.employmentTypeAlignment ?? fallback,
      newLine: style.employmentTypeNewLine,
    },
    ...[
      ...(entry.metadata ?? []),
      entry.gpa ? `GPA${essential ? ":" : ""} ${entry.gpa}` : "",
    ].map((text) => ({
      kind: "detail" as const,
      text,
      alignment: "right" as const,
    })),
    {
      kind: "date",
      text: entry.date ?? "",
      alignment: style.dateAlignment ?? fallback,
      newLine: style.dateNewLine,
    },
  ];
  const inline = fields.filter((field) => field.text && !field.newLine);
  const left = inline.filter((field) => field.alignment === "left");
  return {
    left: timeline ? [] : left,
    right: inline.filter((field) => field.alignment === "right"),
    rail: timeline
      ? [
          ...left.filter((field) => field.kind === "date"),
          ...left.filter((field) => field.kind !== "date"),
        ]
      : [],
    rows: fields.filter((field) => field.text && field.newLine),
  };
}

export function splitEssentialMetadata(
  metadata: ReturnType<typeof entryMetadata>,
  education: boolean,
) {
  const main = (field: MetadataField) => !education && field.kind === "date";
  const detail = (field: MetadataField) => education && field.kind === "detail";
  return {
    left: metadata.left.filter(main),
    right: metadata.right.filter(main),
    secondaryLeft: [
      ...metadata.right.filter(detail),
      ...metadata.left.filter((field) => !main(field)),
    ],
    secondaryRight: metadata.right.filter(
      (field) => !main(field) && !detail(field),
    ),
  };
}
