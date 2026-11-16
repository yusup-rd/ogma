import { LuPlus } from "react-icons/lu";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useEffect, useId, useRef, useState, type Ref } from "react";
import {
  entryKey,
  type EditorSectionId,
} from "@/lib/document-prototype/content-presentation";
import {
  SectionCard,
  VisibilityCheckbox,
  type VisibilityProps,
} from "./section-card";
import dynamic from "next/dynamic";
import type {
  ContactInformation,
  DraftContent,
  EntryIcon,
  SkillLevel,
  WorkProject,
} from "../../../../../packages/contracts/resume-content";
import { EntrySection } from "./entry-section";
import { ResumeImageUpload } from "./resume-image-upload";
import { SelectSetting } from "./select-setting";
const RichTextField = dynamic(() =>
  import("./rich-text-field").then((module) => module.RichTextField),
);

interface ResumeContentFormProps extends VisibilityProps {
  order: EditorSectionId[];
  onReorder: (order: EditorSectionId[]) => void;
  content: DraftContent;
  photo?: string;
  onPhoto: (photo?: string) => void;
  showWorkProjects: boolean;
  onChange: (content: DraftContent) => void;
}

interface PersonalDetailsDraft {
  contact: ContactInformation;
  targetTitle: string;
  photo?: string;
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "month" | "date" | "email" | "tel";
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
  "min-h-10 w-full min-w-0 rounded-lg border border-line bg-paper px-3 py-2 text-sm font-normal disabled:bg-canvas disabled:text-muted";
const contactFields: [
  keyof ContactInformation,
  string,
  TextFieldProps["type"]?,
][] = [
  ["firstName", "First name"],
  ["lastName", "Last name"],
  ["pronouns", "Pronouns"],
  ["email", "Email", "email"],
  ["linkedin", "LinkedIn"],
  ["address", "Address"],
  ["phone", "Phone", "tel"],
  ["website", "Website or portfolio"],
  ["github", "GitHub"],
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
  ["target", "Target"],
  ["chart", "Chart"],
  ["book", "Book"],
  ["heart", "Heart"],
  ["building", "Building"],
] as const satisfies ReadonlyArray<readonly [EntryIcon, string]>;

const newEntry = () => ({ id: crypto.randomUUID() });
const emptyRange = { startDate: "", endDate: "" };
const emptyDescription = { type: "doc" as const };

const TextField = ({
  label,
  value,
  onChange,
  type = "text",
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
            value={project.name}
            inputRef={project.id === newProject ? newName : undefined}
            onChange={(name) => update(project.id, { name })}
          />
          <RichTextField
            label={`Project ${index + 1} description`}
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

const ResumeContentForm = ({
  content,
  photo,
  onPhoto,
  showWorkProjects,
  onChange,
  order,
  onReorder,
  hidden,
  onToggle,
}: ResumeContentFormProps) => {
  const field = <Key extends keyof DraftContent>(
    key: Key,
    value: DraftContent[Key],
  ) => onChange({ ...content, [key]: value });
  const contextId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const visibility = { hidden, onToggle };
  const sections = {
    personal: (
      <SectionCard<PersonalDetailsDraft>
        section="personal"
        subtitle="Name, title and contact information"
        {...visibility}
        value={{
          contact: content.contact,
          targetTitle: content.targetTitle,
          photo,
        }}
        onSave={({ photo, ...details }) => {
          onChange({ ...content, ...details });
          onPhoto(photo);
        }}
      >
        {(details, update, updateCurrent) => (
          <div className="grid grid-cols-2 gap-3">
            {contactFields.map(([key, label, type], index) => (
              <div
                key={key}
                className={`flex min-w-0 items-end gap-2 ${index > 1 ? "col-span-2" : ""}`}
              >
                <div className="pb-3">
                  <VisibilityCheckbox
                    label={`Include ${label.toLowerCase()}`}
                    checked={!hidden.has("contact/" + key)}
                    onChange={() => onToggle("contact/" + key)}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <TextField
                    label={label}
                    type={type}
                    value={details.contact[key]}
                    onChange={(value) =>
                      update({
                        ...details,
                        contact: { ...details.contact, [key]: value },
                      })
                    }
                  />
                </div>
              </div>
            ))}
            <div className="col-span-2 flex min-w-0 items-end gap-2">
              <div className="pb-3">
                <VisibilityCheckbox
                  label="Include target title"
                  checked={!hidden.has("contact/targetTitle")}
                  onChange={() => onToggle("contact/targetTitle")}
                />
              </div>
              <div className="min-w-0 flex-1">
                <TextField
                  label="Target Title"
                  value={details.targetTitle}
                  onChange={(targetTitle) =>
                    update({ ...details, targetTitle })
                  }
                />
              </div>
            </div>
            <div className="col-span-2">
              <ResumeImageUpload
                kind="photo"
                value={details.photo}
                onChange={(photo) =>
                  updateCurrent((current) => ({ ...current, photo }))
                }
              />
            </div>
          </div>
        )}
      </SectionCard>
    ),
    summary: (
      <SectionCard
        section="summary"
        {...visibility}
        value={content.summary}
        onSave={(value) => field("summary", value)}
      >
        {(value, update) => (
          <textarea
            aria-label="Professional Summary"
            className={inputClass}
            rows={4}
            maxLength={8000}
            value={value}
            onChange={(event) => update(event.currentTarget.value)}
          />
        )}
      </SectionCard>
    ),
    experience: (
      <EntrySection<DraftContent["experience"][number]>
        section="experience"
        {...visibility}
        singular="position"
        entries={content.experience}
        update={(entries) => field("experience", entries)}
        label={(entry) => entry.position}
        makeEntry={() => ({
          ...newEntry(),
          ...emptyRange,
          position: "",
          location: "",
          employmentType: "",
          current: false,
          description: emptyDescription,
        })}
      >
        {(entry, patch) => (
          <>
            <TextField
              label="Position"
              value={entry.position}
              onChange={(position) => patch({ position })}
            />
            <TextField
              label="Employer"
              value={entry.employer ?? ""}
              onChange={(employer) => patch({ employer })}
            />
            <TextField
              label="Location"
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
                onChange={(event) =>
                  patch({ current: event.currentTarget.checked })
                }
              />
              Current position
            </label>
            <RichTextField
              label="Position description"
              value={entry.description}
              onChange={(description) => patch({ description })}
            />
            <ResumeImageUpload
              kind="logo"
              value={entry.logo}
              onChange={(logo) => patch({ logo })}
            />
            <WorkProjectsFields
              shown={showWorkProjects}
              projects={entry.projects ?? []}
              onChange={(projects) => patch({ projects })}
            />
          </>
        )}
      </EntrySection>
    ),
    education: (
      <EntrySection<DraftContent["education"][number]>
        section="education"
        {...visibility}
        singular="education entry"
        entries={content.education}
        update={(entries) => field("education", entries)}
        label={(entry) => entry.university || entry.degree}
        makeEntry={() => ({
          ...newEntry(),
          ...emptyRange,
          university: "",
          location: "",
          degree: "",
          fieldOfStudy: "",
          gpa: "",
          description: emptyDescription,
        })}
      >
        {(entry, patch) => (
          <>
            <SelectSetting
              label="Education icon"
              value={entry.icon ?? ""}
              options={[["", "No icon"], ...entryIconOptions]}
              onChange={(value) =>
                patch({
                  icon: entryIconOptions.find(([id]) => id === value)?.[0],
                })
              }
            />
            <TextField
              label="University name"
              value={entry.university}
              onChange={(university) => patch({ university })}
            />
            <TextField
              label="Location"
              value={entry.location}
              onChange={(location) => patch({ location })}
            />
            <TextField
              label="Degree"
              value={entry.degree}
              onChange={(degree) => patch({ degree })}
            />
            <TextField
              label="Field of study"
              value={entry.fieldOfStudy}
              onChange={(fieldOfStudy) => patch({ fieldOfStudy })}
            />
            <TextField
              label="GPA"
              value={entry.gpa}
              onChange={(gpa) => patch({ gpa })}
            />
            <DateRangeFields {...entry} onChange={patch} />
            <RichTextField
              label="Additional information"
              value={entry.description}
              onChange={(description) => patch({ description })}
            />
          </>
        )}
      </EntrySection>
    ),
    skills: (
      <EntrySection<DraftContent["skills"][number]>
        section="skills"
        {...visibility}
        singular="category"
        entries={content.skills}
        update={(entries) => field("skills", entries)}
        label={(entry) => entry.category}
        makeEntry={() => ({ ...newEntry(), category: "", skills: [] })}
      >
        {(entry, patch) => (
          <>
            <TextField
              label="Category"
              value={entry.category}
              onChange={(category) => patch({ category })}
            />
            {entry.skills.map((skill, index) => (
              <div
                key={skill.id}
                className="flex flex-col gap-2 rounded-lg border border-line p-2.5"
              >
                <label className="flex items-center gap-2 text-xs text-muted">
                  <VisibilityCheckbox
                    label={`Include ${skill.name || "skill " + (index + 1)}`}
                    checked={!hidden.has(entryKey(skill.id))}
                    onChange={() => onToggle(entryKey(skill.id))}
                  />
                  Include in resume
                </label>
                <TextField
                  label={`Skill or interest ${index + 1}`}
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
                      skills: entry.skills.filter(
                        (item) => item.id !== skill.id,
                      ),
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
                  skills: [
                    ...entry.skills,
                    { ...newEntry(), name: "", level: "" },
                  ],
                })
              }
            >
              Add skill or interest
            </button>
          </>
        )}
      </EntrySection>
    ),
    certifications: (
      <EntrySection
        section="certifications"
        {...visibility}
        singular="certification"
        entries={content.certifications}
        update={(entries) => field("certifications", entries)}
        label={(entry) => entry.name}
        makeEntry={() => ({
          ...newEntry(),
          ...emptyRange,
          name: "",
          provider: "",
        })}
      >
        {(entry, patch) => (
          <>
            <TextField
              label="Certification"
              value={entry.name}
              onChange={(name) => patch({ name })}
            />
            <TextField
              label="Provider"
              value={entry.provider}
              onChange={(provider) => patch({ provider })}
            />
            <DateRangeFields {...entry} onChange={patch} />
          </>
        )}
      </EntrySection>
    ),
    awards: (
      <EntrySection<DraftContent["awards"][number]>
        section="awards"
        {...visibility}
        singular="award or scholarship"
        entries={content.awards}
        update={(entries) => field("awards", entries)}
        label={(entry) => entry.name}
        makeEntry={() => ({
          ...newEntry(),
          name: "",
          organization: "",
          date: "",
        })}
      >
        {(entry, patch) => (
          <>
            <TextField
              label="Award or scholarship name"
              value={entry.name}
              onChange={(name) => patch({ name })}
            />
            <TextField
              label="Organization"
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
              value={entry.icon ?? ""}
              options={[["", "Bullet"], ...entryIconOptions]}
              onChange={(value) =>
                patch({
                  icon: entryIconOptions.find(([id]) => id === value)?.[0],
                })
              }
            />
          </>
        )}
      </EntrySection>
    ),
    projects: (
      <EntrySection<DraftContent["projects"][number]>
        section="projects"
        {...visibility}
        singular="project"
        entries={content.projects}
        update={(entries) => field("projects", entries)}
        label={(entry) => entry.name}
        makeEntry={() => ({
          ...newEntry(),
          ...emptyRange,
          name: "",
          organization: "",
          description: emptyDescription,
        })}
      >
        {(entry, patch) => (
          <>
            <TextField
              label="Project name"
              value={entry.name}
              onChange={(name) => patch({ name })}
            />
            <TextField
              label="Organization"
              value={entry.organization}
              onChange={(organization) => patch({ organization })}
            />
            <DateRangeFields {...entry} onChange={patch} />
            <RichTextField
              label="Additional information"
              value={entry.description}
              onChange={(description) => patch({ description })}
            />
          </>
        )}
      </EntrySection>
    ),
    volunteering: (
      <EntrySection
        section="volunteering"
        {...visibility}
        singular="volunteer or leadership role"
        entries={content.volunteering}
        update={(entries) => field("volunteering", entries)}
        label={(entry) => entry.organization || entry.involvement}
        makeEntry={() => ({
          ...newEntry(),
          ...emptyRange,
          organization: "",
          involvement: "",
          city: "",
          state: "",
          description: emptyDescription,
        })}
      >
        {(entry, patch) => (
          <>
            <TextField
              label="Organization"
              value={entry.organization}
              onChange={(organization) => patch({ organization })}
            />
            <TextField
              label="Involvement"
              value={entry.involvement}
              onChange={(involvement) => patch({ involvement })}
            />
            <div className="grid grid-cols-2 gap-2">
              <TextField
                label="City"
                value={entry.city}
                onChange={(city) => patch({ city })}
              />
              <TextField
                label="State"
                value={entry.state}
                onChange={(state) => patch({ state })}
              />
            </div>
            <DateRangeFields {...entry} onChange={patch} />
            <RichTextField
              label="Additional information"
              value={entry.description}
              onChange={(description) => patch({ description })}
            />
          </>
        )}
      </EntrySection>
    ),
    publications: (
      <EntrySection
        section="publications"
        {...visibility}
        singular="publication"
        entries={content.publications}
        update={(entries) => field("publications", entries)}
        label={(entry) => entry.name}
        makeEntry={() => ({
          ...newEntry(),
          name: "",
          publisher: "",
          date: "",
          description: emptyDescription,
        })}
      >
        {(entry, patch) => (
          <>
            <TextField
              label="Publication name"
              value={entry.name}
              onChange={(name) => patch({ name })}
            />
            <TextField
              label="Publisher"
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
              value={entry.description}
              onChange={(description) => patch({ description })}
            />
          </>
        )}
      </EntrySection>
    ),
  } satisfies Record<EditorSectionId, React.ReactNode>;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-2xl font-semibold tracking-tight">Content</h2>
        <p className="text-sm text-muted">Choose what this resume includes.</p>
      </div>
      <DndContext
        id={contextId}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={({ active, over }) => {
          if (
            !over ||
            active.id === over.id ||
            over.id === "personal" ||
            over.id === "summary"
          )
            return;
          const from = order.findIndex((section) => section === active.id);
          const to = order.findIndex((section) => section === over.id);
          if (from >= 0 && to >= 0) onReorder(arrayMove(order, from, to));
        }}
      >
        <SortableContext
          items={order.filter((id) => id !== "personal" && id !== "summary")}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-3">
            {order.map((id) => (
              <div key={id}>{sections[id]}</div>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export { ResumeContentForm };
