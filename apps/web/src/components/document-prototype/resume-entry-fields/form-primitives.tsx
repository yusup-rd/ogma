import type {
  ContactInformation,
  EntryIcon,
  SkillLevel,
} from "../../../../../../packages/contracts/resume-content";
import {
  LuAward,
  LuBookOpen,
  LuBuilding2,
  LuChartNoAxesColumnIncreasing,
  LuGraduationCap,
  LuHeart,
  LuStar,
  LuTarget,
} from "react-icons/lu";
import { TextField, type TextFieldProps } from "@/components/ui/form-fields";
interface DateRangeFieldsProps {
  startDate: string;
  endDate: string;
  current?: boolean;
  onChange: (value: Partial<{ startDate: string; endDate: string }>) => void;
}

export const contactFields: [
  keyof ContactInformation,
  string,
  string,
  TextFieldProps["type"]?,
][] = [
  ["firstName", "First name", "John"],
  ["lastName", "Last name", "Doe"],
  ["pronouns", "Pronouns", "he/him"],
  ["email", "Email", "john.doe@example.com", "email"],
  ["linkedin", "LinkedIn", "linkedin.com/in/john-doe"],
  ["address", "Address", "Halifax, Nova Scotia"],
  ["phone", "Phone", "+1 902-555-0136", "tel"],
  ["website", "Website or portfolio", "john-doe.example.com"],
  ["github", "GitHub", "github.com/john-doe"],
];
export const employmentTypes = [
  "Full-time",
  "Part-time",
  "Contract",
  "Freelance",
  "Internship",
  "Temporary",
  "Self-employed",
  "Other",
];
export const levels: SkillLevel[] = [
  "",
  "Beginner",
  "Intermediate",
  "Advanced",
  "Expert",
  "Native",
];
export const entryIconOptions = [
  ["award", "Award"],
  ["graduation", "Graduation cap"],
  ["star", "Star"],
] as const satisfies ReadonlyArray<readonly [EntryIcon, string]>;

const entryIconPreviews = {
  award: LuAward,
  graduation: LuGraduationCap,
  star: LuStar,
  target: LuTarget,
  chart: LuChartNoAxesColumnIncreasing,
  book: LuBookOpen,
  heart: LuHeart,
  building: LuBuilding2,
};
export const renderEntryIcon = (value: string) => {
  const Icon = Object.entries(entryIconPreviews).find(
    ([id]) => id === value,
  )?.[1];
  return Icon ? (
    <Icon className="size-4" />
  ) : (
    <span className="size-1.5 rounded-full bg-current" />
  );
};
export const newEntry = () => ({ id: crypto.randomUUID() });
export const emptyRange = { startDate: "", endDate: "" };
export const emptyDescription = { type: "doc" as const };

export const DateRangeFields = ({
  startDate,
  endDate,
  current,
  onChange,
}: DateRangeFieldsProps) => {
  return (
    <div className="grid grid-cols-2 gap-2">
      <TextField
        label="Start date"
        type="month"
        value={startDate}
        onChange={(startDate) => onChange({ startDate })}
      />
      {current ? (
        <TextField
          label="End date"
          value="Present"
          disabled
          onChange={() => {}}
        />
      ) : (
        <TextField
          label="End date"
          type="month"
          value={endDate}
          onChange={(endDate) => onChange({ endDate })}
        />
      )}
    </div>
  );
};
