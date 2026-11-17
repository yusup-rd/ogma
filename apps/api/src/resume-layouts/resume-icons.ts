import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { IconType } from "react-icons";
import {
  LuAward,
  LuBookOpen,
  LuBriefcaseBusiness,
  LuBuilding2,
  LuCalendarDays,
  LuChartNoAxesColumnIncreasing,
  LuFileText,
  LuFolderKanban,
  LuGithub,
  LuGlobe,
  LuGraduationCap,
  LuHandHeart,
  LuHeart,
  LuLinkedin,
  LuMail,
  LuMapPin,
  LuPhone,
  LuStar,
  LuTarget,
  LuUser,
  LuWrench,
} from "react-icons/lu";
import type { EntryIcon } from "../../../../packages/contracts/resume-content";
import type { SectionId } from "./layout-catalog";
import type { resumeHeader } from "./resume-content";

const toSvg = (Icon: IconType) =>
  renderToStaticMarkup(
    createElement(Icon, { "aria-hidden": true, focusable: "false" }),
  );

const contactIcons = {
  email: LuMail,
  phone: LuPhone,
  address: LuMapPin,
  linkedin: LuLinkedin,
  website: LuGlobe,
  github: LuGithub,
} satisfies Record<
  ReturnType<typeof resumeHeader>["details"][number]["kind"],
  IconType
>;

const sectionIcons = {
  summary: LuFileText,
  experience: LuBriefcaseBusiness,
  education: LuGraduationCap,
  skills: LuWrench,
  certifications: LuAward,
  awards: LuStar,
  projects: LuFolderKanban,
  volunteering: LuHandHeart,
  publications: LuBookOpen,
  contact: LuMail,
} satisfies Record<SectionId | "contact", IconType>;

const entryIcons = {
  award: LuAward,
  graduation: LuGraduationCap,
  star: LuStar,
  target: LuTarget,
  chart: LuChartNoAxesColumnIncreasing,
  book: LuBookOpen,
  heart: LuHeart,
  building: LuBuilding2,
} satisfies Record<EntryIcon, IconType>;

export const contactSvg = (kind: keyof typeof contactIcons) =>
  toSvg(contactIcons[kind]);
export const sectionSvg = (kind: keyof typeof sectionIcons) =>
  toSvg(sectionIcons[kind]);
export const entrySvg = (kind: EntryIcon) => toSvg(entryIcons[kind]);
export const workMetadataSvg = (kind: "date" | "location") =>
  toSvg(kind === "date" ? LuCalendarDays : LuMapPin);
export const portraitPlaceholderSvg = toSvg(LuUser);
