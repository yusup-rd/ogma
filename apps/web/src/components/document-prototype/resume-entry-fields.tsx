import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type Ref } from "react";
import {
  LuPlus,
  LuAward,
  LuGraduationCap,
  LuStar,
  LuTarget,
  LuChartNoAxesColumnIncreasing,
  LuBookOpen,
  LuHeart,
  LuBuilding2,
} from "react-icons/lu";
import type {
  ContactInformation,
  EntryIcon,
  SkillLevel,
  Skill,
  WorkProject,
  WorkEntry,
  EducationEntry,
  SkillCategory,
  CertificationEntry,
  AwardEntry,
  ProjectEntry,
  VolunteerEntry,
  PublicationEntry,
} from "../../../../../packages/contracts/resume-content";
import { entryKey } from "@/lib/document-prototype/content-presentation";
import { VisibilityCheckbox } from "./section-card";
import { ResumeImageUpload } from "./resume-image-upload";
import { SelectSetting } from "./select-setting";
const RichTextField = dynamic(() =>
  import("./rich-text-field").then((module) => module.RichTextField),
);
interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "month" | "date" | "email" | "tel";
  placeholder?: string;
  disabled?: boolean;
  inputRef?: Ref<HTMLInputElement>;
}

interface DateRangeFieldsProps {
  startDate: string;
  endDate: string;
  current?: boolean;
  onChange: (value: Partial<{ startDate: string; endDate: string }>) => void;
}

const inputClass =
  "min-h-10 w-full min-w-0 rounded-lg border border-line bg-paper px-3 py-2 text-sm font-normal placeholder:text-muted disabled:bg-canvas disabled:text-muted";
const contactFields: [
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
const employmentTypes = [
  "Full-time",
  "Part-time",
  "Contract",
  "Freelance",
  "Internship",
  "Temporary",
  "Self-employed",
  "Other",
];
const levels: SkillLevel[] = [
  "",
  "Beginner",
  "Intermediate",
  "Advanced",
  "Expert",
  "Native",
];
const entryIconOptions = [
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
const renderEntryIcon = (value: string) => {
  const Icon = Object.entries(entryIconPreviews).find(
    ([id]) => id === value,
  )?.[1];
  return Icon ? (
    <Icon className="size-4" />
  ) : (
    <span className="size-1.5 rounded-full bg-current" />
  );
};
const newEntry = () => ({ id: crypto.randomUUID() });
const emptyRange = { startDate: "", endDate: "" };
const emptyDescription = { type: "doc" as const };

const TextField = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled = false,
  inputRef,
}: TextFieldProps) => {
  return (
    <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold">
      {label}
      <input
        ref={inputRef}
        className={inputClass}
        type={type}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        maxLength={240}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </label>
  );
};

const DateRangeFields = ({
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

interface WorkProjectsFieldsProps {
  projects: WorkProject[];
  shown: boolean;
  onChange: (projects: WorkProject[]) => void;
}

const WorkProjectsFields = ({
  projects,
  shown,
  onChange,
}: WorkProjectsFieldsProps) => {
  const [newProject, setNewProject] = useState<string>();
  const newName = useRef<HTMLInputElement>(null);
  const addButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (newProject) newName.current?.focus();
  }, [newProject]);

  const update = (id: string, changes: Partial<WorkProject>) =>
    onChange(
      projects.map((project) =>
        project.id === id ? { ...project, ...changes } : project,
      ),
    );

  return (
    <fieldset className="flex min-w-0 flex-col gap-3 rounded-lg border border-line bg-canvas p-2.5">
      <legend className="px-1 text-xs font-semibold">
        Projects for this job
      </legend>
      {!shown && projects.length > 0 && (
        <p className="text-xs text-muted">
          Enable job project tables in Design to include these projects on the
          resume.
        </p>
      )}
      {projects.map((project, index) => (
        <div
          key={project.id}
          className="flex min-w-0 flex-col gap-2 rounded-md border border-line bg-paper p-2.5"
        >
          <TextField
            label={`Project ${index + 1} name`}
            placeholder="Customer onboarding redesign"
            value={project.name}
            inputRef={project.id === newProject ? newName : undefined}
            onChange={(name) => update(project.id, { name })}
          />
          <RichTextField
            label={`Project ${index + 1} description`}
            placeholder="Describe your contribution and what changed."
            value={project.description}
            onChange={(description) => update(project.id, { description })}
          />
          <button
            type="button"
            aria-label={`Remove project ${index + 1}`}
            className="min-h-9 self-start rounded-md px-2 text-xs font-semibold text-red-800 hover:bg-red-50 active:bg-red-100"
            onClick={() => {
              onChange(projects.filter(({ id }) => id !== project.id));
              requestAnimationFrame(() => addButton.current?.focus());
            }}
          >
            Remove project
          </button>
        </div>
      ))}
      <button
        ref={addButton}
        type="button"
        disabled={projects.length >= 50}
        className="inline-flex min-h-10 items-center gap-1.5 self-start rounded-md border border-line bg-paper px-3 text-xs font-semibold hover:border-accent/40 active:bg-accent-soft disabled:opacity-50"
        onClick={() => {
          const project = {
            ...newEntry(),
            name: "",
            description: emptyDescription,
          };
          onChange([...projects, project]);
          setNewProject(project.id);
        }}
      >
        <LuPlus aria-hidden="true" className="size-4 shrink-0" />
        {projects.length ? "Add another project" : "Add a project for this job"}
      </button>
    </fieldset>
  );
};

interface WorkFieldsProps {
  entry: WorkEntry;
  patch: (changes: Partial<WorkEntry>) => void;
  showWorkProjects: boolean;
  onLogoBusyChange?: (busy: boolean) => void;
}
const WorkFields = ({
  entry,
  patch,
  showWorkProjects,
  onLogoBusyChange,
}: WorkFieldsProps) => {
  return (
    <>
      <TextField
        label="Position"
        placeholder="Software Engineer"
        value={entry.position}
        onChange={(position) => patch({ position })}
      />
      <TextField
        label="Employer"
        placeholder="Company name"
        value={entry.employer ?? ""}
        onChange={(employer) => patch({ employer })}
      />
      <TextField
        label="Location"
        placeholder="City, country or remote"
        value={entry.location}
        onChange={(location) => patch({ location })}
      />
      <SelectSetting
        label="Employment type"
        value={entry.employmentType}
        options={[
          ["", "Select an employment type"],
          ...employmentTypes.map((type) => [type, type] as const),
          ...(entry.employmentType &&
          !employmentTypes.includes(entry.employmentType)
            ? [[entry.employmentType, entry.employmentType] as const]
            : []),
        ]}
        onChange={(employmentType) => patch({ employmentType })}
      />
      <DateRangeFields {...entry} onChange={patch} />
      <label className="flex min-h-8 items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-4 accent-accent"
          checked={entry.current}
          onChange={(event) => patch({ current: event.currentTarget.checked })}
        />
        Current position
      </label>
      <RichTextField
        label="Position description"
        placeholder="Describe what you did and the results you achieved."
        value={entry.description}
        onChange={(description) => patch({ description })}
      />
      <ResumeImageUpload
        kind="logo"
        onBusyChange={onLogoBusyChange}
        value={entry.logo}
        onChange={(logo) => patch({ logo })}
      />
      <WorkProjectsFields
        shown={showWorkProjects}
        projects={entry.projects ?? []}
        onChange={(projects) => patch({ projects })}
      />
    </>
  );
};

interface EducationFieldsProps {
  entry: EducationEntry;
  patch: (changes: Partial<EducationEntry>) => void;
}
const EducationFields = ({ entry, patch }: EducationFieldsProps) => {
  return (
    <>
      <TextField
        label="University name"
        placeholder="University or college name"
        value={entry.university}
        onChange={(university) => patch({ university })}
      />
      <TextField
        label="Location"
        placeholder="City, country"
        value={entry.location}
        onChange={(location) => patch({ location })}
      />
      <TextField
        label="Degree"
        placeholder="Bachelor of Science"
        value={entry.degree}
        onChange={(degree) => patch({ degree })}
      />
      <TextField
        label="Field of study"
        placeholder="Computer Science"
        value={entry.fieldOfStudy}
        onChange={(fieldOfStudy) => patch({ fieldOfStudy })}
      />
      <TextField
        label="GPA"
        placeholder="3.8 / 4.0"
        value={entry.gpa}
        onChange={(gpa) => patch({ gpa })}
      />
      <DateRangeFields {...entry} onChange={patch} />
      <RichTextField
        label="Additional information"
        placeholder="Add relevant coursework, honors, or activities."
        value={entry.description}
        onChange={(description) => patch({ description })}
      />
    </>
  );
};

interface SkillsFieldsProps {
  entry: SkillCategory;
  patch: (changes: Partial<SkillCategory>) => void;
  visibility?: { hidden: ReadonlySet<string>; onToggle: (key: string) => void };
}
const SkillsFields = ({ entry, patch, visibility }: SkillsFieldsProps) => {
  return (
    <>
      <TextField
        label="Category"
        placeholder="Development tools"
        value={entry.category}
        onChange={(category) => patch({ category })}
      />
      {entry.skills.map((skill, index) => (
        <div
          key={skill.id}
          className="flex flex-col gap-2 rounded-lg border border-line p-2.5"
        >
          {visibility && (
            <label className="flex items-center gap-2 text-xs text-muted">
              <VisibilityCheckbox
                label={`Include ${skill.name || "skill " + (index + 1)}`}
                checked={!visibility.hidden.has(entryKey(skill.id))}
                onChange={() => visibility.onToggle(entryKey(skill.id))}
              />
              Include in resume
            </label>
          )}
          <TextField
            label={`Skill or interest ${index + 1}`}
            placeholder="TypeScript"
            value={skill.name}
            onChange={(name) =>
              patch({
                skills: entry.skills.map((item) =>
                  item.id === skill.id ? { ...item, name } : item,
                ),
              })
            }
          />
          <SelectSetting
            label="Level"
            accessibleLabel={`Level for ${skill.name || "skill " + (index + 1)}`}
            value={skill.level}
            options={levels.map(
              (level) => [level, level || "No level"] as const,
            )}
            onChange={(level) =>
              patch({
                skills: entry.skills.map((item) =>
                  item.id === skill.id ? { ...item, level } : item,
                ),
              })
            }
          />
          <button
            type="button"
            className="min-h-9 self-start px-1 text-xs font-semibold text-red-800"
            onClick={() =>
              patch({
                skills: entry.skills.filter((item) => item.id !== skill.id),
              })
            }
          >
            Remove skill
          </button>
        </div>
      ))}
      <button
        type="button"
        disabled={entry.skills.length >= 50}
        className="min-h-10 self-start rounded-md border border-line px-3 text-xs font-semibold hover:bg-canvas disabled:opacity-50"
        onClick={() =>
          patch({
            skills: [...entry.skills, { ...newEntry(), name: "", level: "" }],
          })
        }
      >
        Add skill or interest
      </button>
    </>
  );
};

interface CertificationFieldsProps {
  entry: CertificationEntry;
  patch: (changes: Partial<CertificationEntry>) => void;
}
const CertificationFields = ({ entry, patch }: CertificationFieldsProps) => {
  return (
    <>
      <TextField
        label="Certification"
        placeholder="Google Data Analytics Certificate"
        value={entry.name}
        onChange={(name) => patch({ name })}
      />
      <TextField
        label="Provider"
        placeholder="Issuing organization"
        value={entry.provider}
        onChange={(provider) => patch({ provider })}
      />
      <DateRangeFields {...entry} onChange={patch} />
    </>
  );
};

interface AwardFieldsProps {
  entry: AwardEntry;
  patch: (changes: Partial<AwardEntry>) => void;
}
const AwardFields = ({ entry, patch }: AwardFieldsProps) => {
  return (
    <>
      <TextField
        label="Award or scholarship name"
        placeholder="Academic Excellence Award"
        value={entry.name}
        onChange={(name) => patch({ name })}
      />
      <TextField
        label="Organization"
        placeholder="Awarding organization"
        value={entry.organization}
        onChange={(organization) => patch({ organization })}
      />
      <TextField
        label="Date earned"
        type="date"
        value={entry.date}
        onChange={(date) => patch({ date })}
      />
      <SelectSetting
        label="Award icon"
        renderPreview={renderEntryIcon}
        value={entry.icon ?? ""}
        options={[
          ["", "Bullet"],
          ...entryIconOptions,
          ...(entry.icon && !entryIconOptions.some(([id]) => id === entry.icon)
            ? [[entry.icon, "Saved icon"] as const]
            : []),
        ]}
        onChange={(value) =>
          patch({
            icon:
              value === entry.icon
                ? entry.icon
                : entryIconOptions.find(([id]) => id === value)?.[0],
          })
        }
      />
    </>
  );
};

interface ProjectFieldsProps {
  entry: ProjectEntry;
  patch: (changes: Partial<ProjectEntry>) => void;
}
const ProjectFields = ({ entry, patch }: ProjectFieldsProps) => {
  return (
    <>
      <TextField
        label="Project name"
        placeholder="Personal portfolio"
        value={entry.name}
        onChange={(name) => patch({ name })}
      />
      <TextField
        label="Organization"
        placeholder="Organization or client"
        value={entry.organization}
        onChange={(organization) => patch({ organization })}
      />
      <DateRangeFields {...entry} onChange={patch} />
      <RichTextField
        label="Additional information"
        placeholder="Explain the goal, your role, and the outcome."
        value={entry.description}
        onChange={(description) => patch({ description })}
      />
    </>
  );
};

interface VolunteerFieldsProps {
  entry: VolunteerEntry;
  patch: (changes: Partial<VolunteerEntry>) => void;
}
const VolunteerFields = ({ entry, patch }: VolunteerFieldsProps) => {
  return (
    <>
      <TextField
        label="Organization"
        placeholder="Nonprofit or community group"
        value={entry.organization}
        onChange={(organization) => patch({ organization })}
      />
      <TextField
        label="Involvement"
        placeholder="Volunteer coordinator"
        value={entry.involvement}
        onChange={(involvement) => patch({ involvement })}
      />
      <div className="grid grid-cols-2 gap-2">
        <TextField
          label="City"
          placeholder="Toronto"
          value={entry.city}
          onChange={(city) => patch({ city })}
        />
        <TextField
          label="State"
          placeholder="Ontario"
          value={entry.state}
          onChange={(state) => patch({ state })}
        />
      </div>
      <DateRangeFields {...entry} onChange={patch} />
      <RichTextField
        label="Additional information"
        placeholder="Describe who you supported and the impact of your work."
        value={entry.description}
        onChange={(description) => patch({ description })}
      />
    </>
  );
};

interface PublicationFieldsProps {
  entry: PublicationEntry;
  patch: (changes: Partial<PublicationEntry>) => void;
}
const PublicationFields = ({ entry, patch }: PublicationFieldsProps) => {
  return (
    <>
      <TextField
        label="Publication name"
        placeholder="Title of your article or paper"
        value={entry.name}
        onChange={(name) => patch({ name })}
      />
      <TextField
        label="Publisher"
        placeholder="Journal or publisher name"
        value={entry.publisher}
        onChange={(publisher) => patch({ publisher })}
      />
      <TextField
        label="Date"
        type="date"
        value={entry.date}
        onChange={(date) => patch({ date })}
      />
      <RichTextField
        label="Additional information"
        placeholder="Add co-authors, a link, or a brief summary."
        value={entry.description}
        onChange={(description) => patch({ description })}
      />
    </>
  );
};

interface LanguageFieldsProps {
  entry: Skill;
  patch: (changes: Partial<Skill>) => void;
}
const LanguageFields = ({ entry, patch }: LanguageFieldsProps) => {
  return (
    <>
      <TextField
        label="Language"
        placeholder="English"
        value={entry.name}
        onChange={(name) => patch({ name })}
      />
      <SelectSetting
        label="Proficiency"
        value={entry.level}
        options={levels.map((level) => [level, level || "No level"] as const)}
        onChange={(level) => patch({ level })}
      />
    </>
  );
};
export {
  LanguageFields,
  contactFields,
  inputClass,
  levels,
  newEntry,
  emptyRange,
  emptyDescription,
  TextField,
  WorkFields,
  EducationFields,
  SkillsFields,
  CertificationFields,
  AwardFields,
  ProjectFields,
  VolunteerFields,
  PublicationFields,
};
