export type RichMark = { type: "bold" | "italic" | "underline" };
export type RichInline =
  { type: "text"; text: string; marks?: RichMark[] } | { type: "hardBreak" };
export type RichParagraph = { type: "paragraph"; content?: RichInline[] };
export type RichList =
  | { type: "bulletList"; content: RichListItem[] }
  | {
      type: "orderedList";
      attrs?: { start?: number };
      content: RichListItem[];
    };
export type RichListItem = {
  type: "listItem";
  content: [RichParagraph, ...RichBlock[]];
};
export type RichBlock = RichParagraph | RichList;
export type RichText = { type: "doc"; content?: RichBlock[] };

export interface ContactInformation {
  firstName: string;
  lastName: string;
  pronouns: string;
  email: string;
  linkedin: string;
  address: string;
  phone: string;
  website: string;
  github: string;
}

interface Entry {
  id: string;
}

interface DateRange {
  startDate: string;
  endDate: string;
}

export interface WorkEntry extends Entry, DateRange {
  position: string;
  description: RichText;
  location: string;
  employmentType: string;
  current: boolean;
}

export interface EducationEntry extends Entry, DateRange {
  university: string;
  location: string;
  degree: string;
  fieldOfStudy: string;
  gpa: string;
  description: RichText;
}

export type SkillLevel =
  "" | "Beginner" | "Intermediate" | "Advanced" | "Expert";

export interface Skill extends Entry {
  name: string;
  level: SkillLevel;
}

export interface SkillCategory extends Entry {
  category: string;
  skills: Skill[];
}

export interface CertificationEntry extends Entry, DateRange {
  name: string;
  provider: string;
}

export interface AwardEntry extends Entry {
  name: string;
  organization: string;
  date: string;
}

export interface ProjectEntry extends Entry, DateRange {
  name: string;
  organization: string;
  description: RichText;
}

export interface VolunteerEntry extends Entry, DateRange {
  organization: string;
  involvement: string;
  city: string;
  state: string;
  description: RichText;
}

export interface PublicationEntry extends Entry {
  name: string;
  publisher: string;
  date: string;
  description: RichText;
}

export interface DraftContent {
  contact: ContactInformation;
  targetTitle: string;
  summary: string;
  experience: WorkEntry[];
  education: EducationEntry[];
  skills: SkillCategory[];
  certifications: CertificationEntry[];
  awards: AwardEntry[];
  projects: ProjectEntry[];
  volunteering: VolunteerEntry[];
  publications: PublicationEntry[];
}
export type ResumeSectionId = Exclude<
  keyof DraftContent,
  "contact" | "targetTitle"
>;

export type PaperSize = "a4" | "letter";
export type DateFormat = "numeric" | "year" | "short" | "long";
export type HeaderAlignment = "left" | "center" | "right";
export type SideAlignment = "left" | "right";
export type SkillsLayout = "inline" | "list" | "bullet" | "columns";
export type TextRole =
  "body" | "primary" | "secondary" | "section" | "name" | "minor";
export type TextWeight = 200 | 300 | 400 | 600 | 700;
export type SpacingRole =
  "sections" | "titleContent" | "headings" | "blocks" | "listItems";
export type PageEdge = "top" | "right" | "bottom" | "left";

export interface DesignOptions {
  paperSize?: PaperSize;
  listLineHeight?: number;
  dateFormat?: DateFormat;
  headerAlignment?: HeaderAlignment;
  dateAlignment?: SideAlignment;
  locationAlignment?: SideAlignment;
  employmentTypeAlignment?: SideAlignment;
  dateNewLine?: boolean;
  locationNewLine?: boolean;
  employmentTypeNewLine?: boolean;
  skillsLayout?: SkillsLayout;
  margins?: Partial<Record<PageEdge, number>>;
  sizes?: Partial<Record<Exclude<TextRole, "body">, number>>;
  weights?: Partial<Record<TextRole, TextWeight>>;
  spacing?: Partial<Record<SpacingRole, number>>;
}

export interface DesignDefaults {
  dateFormat: DateFormat;
  headerAlignment: HeaderAlignment;
  dateAlignment: SideAlignment;
  locationAlignment: SideAlignment;
  employmentTypeAlignment: SideAlignment;
  skillsLayout: SkillsLayout;
  sizes: Record<TextRole, number>;
  weights: Record<TextRole, TextWeight>;
  spacing: Record<SpacingRole, number>;
}
