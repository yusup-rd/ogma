import type {
  EducationEntry,
  Skill,
  SkillCategory,
  CertificationEntry,
  AwardEntry,
  ProjectEntry,
  VolunteerEntry,
  PublicationEntry,
} from "../../../../../../packages/contracts/resume-content";
import { entryKey } from "@/lib/document-prototype/content-presentation";
import { VisibilityCheckbox } from "../section-card";
import { SelectSetting } from "../select-setting";
import { TextField } from "@/components/ui/form-fields";
import { RichTextField } from "./rich-text-field-lazy";
import {
  DateRangeFields,
  entryIconOptions,
  levels,
  newEntry,
  renderEntryIcon,
} from "./form-primitives";
interface EducationFieldsProps {
  entry: EducationEntry;
  patch: (changes: Partial<EducationEntry>) => void;
}
export const EducationFields = ({ entry, patch }: EducationFieldsProps) => {
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
export const SkillsFields = ({
  entry,
  patch,
  visibility,
}: SkillsFieldsProps) => {
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
export const CertificationFields = ({
  entry,
  patch,
}: CertificationFieldsProps) => {
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
export const AwardFields = ({ entry, patch }: AwardFieldsProps) => {
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
export const ProjectFields = ({ entry, patch }: ProjectFieldsProps) => {
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
export const VolunteerFields = ({ entry, patch }: VolunteerFieldsProps) => {
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
export const PublicationFields = ({ entry, patch }: PublicationFieldsProps) => {
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
export const LanguageFields = ({ entry, patch }: LanguageFieldsProps) => {
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
