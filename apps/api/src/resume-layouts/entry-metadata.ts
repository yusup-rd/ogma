import type {
  DesignOptions,
  SideAlignment,
} from "../../../../packages/contracts/resume-content";
import type { ResumeEntry } from "./resume-content";

type MetadataKind = "location" | "employment-type" | "date" | "detail";
interface MetadataField {
  kind: MetadataKind;
  text: string;
  alignment: SideAlignment;
  newLine?: boolean;
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
