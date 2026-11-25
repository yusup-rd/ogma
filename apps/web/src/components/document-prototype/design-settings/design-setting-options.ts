export const palettes = [
  { name: "Ink", color: "#242726" },
  { name: "Brown", color: "#6B4B36" },
  { name: "Navy", color: "#25475A" },
  { name: "Purple", color: "#663994" },
  { name: "Green", color: "#286F5D" },
];
export const textRoles = [
  ["body", "Body copy"],
  ["primary", "Primary heading"],
  ["secondary", "Secondary heading"],
  ["section", "Section titles"],
  ["name", "Full name"],
  ["minor", "Minor copy"],
] as const;
export const spacingRoles = [
  ["sections", "Between sections"],
  ["titleContent", "Between titles and content"],
  ["headings", "Between primary and secondary headings"],
  ["blocks", "Between content blocks"],
  ["listItems", "Between list items"],
] as const;
export const weightOptions = [
  [200, "Extra light"],
  [300, "Light"],
  [400, "Regular"],
  [600, "Semibold"],
  [700, "Bold"],
] as const;
export const dateOptions = [
  ["numeric", "Numbers (MM/YYYY)"],
  ["year", "Year (YYYY)"],
  ["short", "Short month (Jan YYYY)"],
  ["long", "Long month (January YYYY)"],
] as const;
export const dateSeparators = [
  ["dash", "En dash (–)"],
  ["hyphen", "Hyphen (-)"],
] as const;
export const alignmentOptions = [
  ["left", "Left"],
  ["right", "Right"],
] as const;
export const workHeadingOptions = [
  ["position-first", "Role first"],
  ["employer-first", "Employer first"],
] as const;
export const workPlacementOptions = [
  ["first", "First heading row"],
  ["second", "Second heading row"],
  ["below", "Below both headings"],
  ["rail", "Timeline rail"],
] as const;
export const headerOptions = [
  ["left", "Left"],
  ["center", "Center"],
  ["right", "Right"],
] as const;
export const skillOptions = [
  ["inline", "Comma separated"],
  ["list", "Comma separated list"],
  ["bullet", "Bullet separated"],
  ["columns", "Columns"],
  ["lined", "Underlined items"],
] as const;

export const proficiencyOptions = [
  ["dots", "Dots"],
  ["bold-dots", "Large dots"],
  ["sticks", "Rounded sticks"],
  ["bar", "Progress bar"],
] as const;

export const metadataControls = [
  {
    label: "Date",
    field: "date",
    alignment: "dateAlignment",
    newLine: "dateNewLine",
    placement: "workDatePlacement",
  },
  {
    label: "Location",
    field: "location",
    alignment: "locationAlignment",
    newLine: "locationNewLine",
    placement: "workLocationPlacement",
  },
  {
    label: "Employment type",
    field: "employmentType",
    alignment: "employmentTypeAlignment",
    newLine: "employmentTypeNewLine",
    placement: "workEmploymentTypePlacement",
  },
] as const;
