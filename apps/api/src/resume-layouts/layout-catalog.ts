export const sectionIds = [
  "summary",
  "experience",
  "awards",
  "skills",
  "education",
  "certifications",
  "projects",
  "volunteering",
  "publications",
] as const;
export type SectionId = (typeof sectionIds)[number];

export const fontChoices = {
  inter: {
    label: "Inter",
    css: '"Ogma Inter", Arial, sans-serif',
    word: "Inter",
  },
  sans: { label: "Arial", css: "Arial, sans-serif", word: "Arial" },
  humanist: {
    label: "Trebuchet MS",
    css: '"Trebuchet MS", Arial, sans-serif',
    word: "Trebuchet MS",
  },
  serif: { label: "Georgia", css: "Georgia, serif", word: "Georgia" },
  editorial: {
    label: "Times New Roman",
    css: '"Times New Roman", serif',
    word: "Times New Roman",
  },
} as const;

export type LayoutFont = keyof typeof fontChoices;
type Header = "left" | "center" | "banner" | "badge";
type Rail = "none" | "left" | "right" | "left-column";
type Heading = "underline" | "center-rule" | "spaced" | "hairline" | "plain";
type Media = "none" | "top" | "right" | "rail";

export interface ResumeLayout {
  id: string;
  name: string;
  header: Header;
  rail: Rail;
  heading: Heading;
  photo: Media;
  photoShape: "circle" | "square";
  logos: "none" | "left" | "right";
  font: LayoutFont;
  accent: string;
  paper: string;
  sideColor?: string;
  main: readonly SectionId[];
  side: readonly SectionId[];
  ratio: number;
  bodySize: number;
  sectionGap: number;
  margin: number;
  lineHeight: number;
  timeline: boolean;
  achievementColumns: number;
  proficiencyAfter?: SectionId;
}

type LayoutOptions = Omit<Partial<ResumeLayout>, "id" | "name">;

function layout(
  id: string,
  name: string,
  main: readonly SectionId[],
  options: LayoutOptions = {},
): ResumeLayout {
  return {
    id,
    name,
    header: "left",
    rail: "none",
    heading: "underline",
    photo: "none",
    photoShape: "circle",
    logos: "none",
    font: "sans",
    accent: "#1677C7",
    paper: "#FFFFFF",
    main,
    side: [],
    ratio: 63,
    bodySize: 8,
    sectionGap: 4.7,
    margin: 9,
    lineHeight: 1.32,
    timeline: false,
    achievementColumns: 1,
    ...options,
  };
}

const ivyLeague = {
  header: "center",
  heading: "center-rule",
  font: "editorial",
  accent: "#242424",
  bodySize: 8,
  margin: 13,
  sectionGap: 5.5,
  lineHeight: 1.23,
  achievementColumns: 3,
} as const;

const crest = {
  header: "center",
  heading: "spaced",
  font: "editorial",
  accent: "#6E6455",
  paper: "#FBF9F2",
  margin: 12,
  bodySize: 9,
  sectionGap: 8,
  lineHeight: 1.36,
} as const;

export const resumeLayouts = [
  layout("double-column", "Double Column", ["summary", "experience"], {
    side: ["awards", "skills", "education", "certifications"],
    proficiencyAfter: "certifications",
  }),
  layout(
    "ivy-league",
    "Ivy League",
    [
      "summary",
      "experience",
      "skills",
      "certifications",
      "education",
      "awards",
    ],
    ivyLeague,
  ),
  layout("elegant", "Elegant", ["summary", "experience", "skills"], {
    font: "serif",
    rail: "right",
    photo: "rail",
    heading: "hairline",
    sideColor: "#203E56",
    accent: "#168BD6",
    ratio: 65,
    side: ["awards", "education", "certifications"],
    proficiencyAfter: "awards",
  }),
  layout("crest", "Crest", ["summary", "experience", "education", "skills"], {
    ...crest,
  }),
  layout(
    "single-column",
    "Single Column",
    ["summary", "awards", "experience", "education", "skills"],
    {
      achievementColumns: 2,
      proficiencyAfter: "education",
      sectionGap: 5.4,
      lineHeight: 1.37,
    },
  ),
  layout("polished", "Polished", ["summary", "experience"], {
    rail: "left",
    heading: "hairline",
    photo: "rail",
    photoShape: "square",
    ratio: 34,
    sideColor: "#07575B",
    accent: "#249592",
    margin: 11,
    side: ["awards", "education", "skills", "certifications"],
    proficiencyAfter: "experience",
  }),
  layout("imprint", "Imprint", ["summary", "awards", "experience"], {
    font: "serif",
    heading: "spaced",
    accent: "#659BBC",
    margin: 12,
    bodySize: 9.4,
    sectionGap: 9,
    lineHeight: 1.46,
  }),
  layout(
    "timeline",
    "Timeline",
    [
      "summary",
      "experience",
      "skills",
      "awards",
      "certifications",
      "education",
    ],
    {
      heading: "plain",
      timeline: true,
      accent: "#405B72",
      achievementColumns: 2,
      proficiencyAfter: "education",
    },
  ),
  layout("creative", "Creative", ["summary", "experience"], {
    header: "banner",
    photo: "right",
    heading: "hairline",
    sideColor: "#252F57",
    accent: "#283662",
    ratio: 62,
    side: ["awards", "skills", "education", "certifications"],
    proficiencyAfter: "certifications",
  }),
  layout("stylish", "Stylish", ["summary", "experience", "education"], {
    rail: "left-column",
    ratio: 34,
    heading: "hairline",
    accent: "#27547B",
    side: ["awards", "skills", "certifications"],
    proficiencyAfter: "education",
  }),
  layout("modern", "Modern", ["summary", "experience"], {
    photo: "right",
    heading: "hairline",
    accent: "#1A4C87",
    ratio: 60,
    side: ["skills", "awards", "education", "certifications"],
    proficiencyAfter: "certifications",
  }),
  layout(
    "contemporary",
    "Contemporary",
    ["summary", "experience", "education"],
    {
      header: "badge",
      rail: "left-column",
      photo: "rail",
      ratio: 35,
      heading: "plain",
      accent: "#32694F",
      sideColor: "#A5D8BE",
      margin: 9,
      sectionGap: 5.2,
      lineHeight: 1.43,
      side: ["skills", "awards", "certifications"],
    },
  ),
  layout(
    "ivy-league-photo",
    "Ivy League with Photo",
    [
      "summary",
      "awards",
      "experience",
      "skills",
      "education",
      "certifications",
    ],
    {
      ...ivyLeague,
      photo: "top",
      accent: "#385B7E",
    },
  ),
  layout(
    "ivy-league-logos",
    "Ivy League with Logos",
    [
      "summary",
      "experience",
      "education",
      "certifications",
      "skills",
      "awards",
    ],
    {
      ...ivyLeague,
      logos: "left",
      accent: "#325A9E",
      proficiencyAfter: "awards",
    },
  ),
  layout(
    "single-column-photo",
    "Single Column with Photo",
    ["summary", "awards", "experience", "education", "skills"],
    {
      photo: "right",
      accent: "#344A7A",
      achievementColumns: 2,
    },
  ),
  layout("elegant-logos", "Elegant with Logos", ["summary", "experience"], {
    rail: "right",
    heading: "hairline",
    sideColor: "#07585C",
    logos: "left",
    accent: "#268D90",
    ratio: 64,
    side: ["awards", "skills", "certifications", "education"],
  }),
  layout(
    "double-column-logos",
    "Double Column with Logos",
    ["summary", "experience"],
    {
      logos: "left",
      font: "serif",
      accent: "#225492",
      ratio: 56,
      side: ["awards", "skills", "education"],
      proficiencyAfter: "education",
    },
  ),
  layout("compact", "Compact", ["experience"], {
    heading: "plain",
    photo: "right",
    sectionGap: 3,
    margin: 12,
    ratio: 58,
    accent: "#24496C",
    side: ["summary", "awards", "skills", "education"],
  }),
  layout(
    "timeline-logos",
    "Timeline with Logos",
    ["summary", "experience", "education", "skills", "awards", "projects"],
    {
      heading: "plain",
      timeline: true,
      logos: "right",
      photo: "right",
      accent: "#286B59",
      achievementColumns: 2,
    },
  ),
  layout(
    "classic",
    "Classic",
    [
      "summary",
      "experience",
      "education",
      "awards",
      "skills",
      "certifications",
    ],
    {
      heading: "plain",
      accent: "#536089",
      achievementColumns: 2,
    },
  ),
  layout("high-performer", "High Performer", ["experience", "skills"], {
    ratio: 60,
    accent: "#369AAF",
    heading: "hairline",
    side: ["summary", "awards", "education", "certifications"],
    proficiencyAfter: "skills",
  }),
  layout("minimal", "Minimal", ["summary", "experience", "education"], {
    ratio: 59,
    heading: "plain",
    accent: "#2B9662",
    margin: 13,
    sectionGap: 6,
    side: ["awards", "skills", "projects"],
    proficiencyAfter: "education",
  }),
  layout(
    "crest-projects",
    "Crest with Projects",
    ["summary", "projects", "education", "skills", "experience"],
    {
      ...crest,
      sectionGap: 9.6,
    },
  ),
] as const;

export function getResumeLayout(id: string) {
  return resumeLayouts.find((option) => option.id === id);
}

export function resumeColumns(
  layout: ResumeLayout,
  sectionOrder?: SectionId[],
) {
  const remaining = sectionIds.filter(
    (section) =>
      !layout.main.includes(section) && !layout.side.includes(section),
  );
  const main = [...layout.main, ...remaining];
  if (!sectionOrder?.length) return { main, side: layout.side };
  const order = Array.from(new Set([...sectionOrder, ...main, ...layout.side]));
  return { main: order.slice(0, main.length), side: order.slice(main.length) };
}
