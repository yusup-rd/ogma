import type { ResumeLayout } from "./layout-catalog";

const tablePaper = "#f1f1f1";

function rgb(hex: string) {
  return [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));
}

function luminance(channels: number[]) {
  const [red, green, blue] = channels.map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function readableInk(accent: string, paper: string) {
  const paperLuminance = luminance(rgb(paper));
  let channels = rgb(accent);
  while (
    channels.some(Boolean) &&
    (paperLuminance + 0.05) / (luminance(channels) + 0.05) < 4.5
  ) {
    channels = channels.map((channel) => Math.floor(channel * 0.95));
  }
  return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

export function resumeColors(layout: ResumeLayout, chosenAccent: string) {
  const custom = chosenAccent.toLowerCase() !== layout.accent.toLowerCase();
  const editorial = layout.heading === "spaced" && layout.header === "center";
  const plainHeadings = layout.heading === "plain" && !layout.timeline;
  const accent = readableInk(chosenAccent, layout.paper);
  // Modern's default palette pairs navy structure with warm supporting text.
  const supportingInk = !custom && layout.id === "modern" ? "#a85d24" : accent;

  return {
    custom,
    accent,
    supportingInk,
    tablePaper,
    tableInk: readableInk(supportingInk, tablePaper),
    role: layout.id !== "classic" && layout.id !== "minimal",
    organizations:
      !editorial &&
      !["ivy-league", "classic", "minimal", "contemporary"].includes(layout.id),
    headings: plainHeadings,
    headingRule: editorial
      ? "top"
      : layout.heading === "plain"
        ? undefined
        : "bottom",
  } as const;
}
