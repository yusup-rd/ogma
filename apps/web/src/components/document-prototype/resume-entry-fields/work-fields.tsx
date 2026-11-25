import { projectBulletKey } from "@ogma/contracts/resolve-resume";
import { useEffect, useRef, useState } from "react";
import { LuPlus } from "react-icons/lu";
import type {
  WorkEntry,
  WorkProject,
} from "../../../../../../packages/contracts/resume-content";
import { descriptionBullets } from "@/lib/document-prototype/content-presentation";
import { VisibilityCheckbox } from "../section-card";
import { ResumeImageUpload } from "../resume-image-upload";
import { SelectSetting } from "../select-setting";
import { TextField } from "@/components/ui/form-fields";
import { RichTextField } from "./rich-text-field-lazy";
import {
  DateRangeFields,
  emptyDescription,
  employmentTypes,
  newEntry,
} from "./form-primitives";
interface WorkProjectsFieldsProps {
  projects: WorkProject[];
  shown: boolean;
  entryId: string;
  visibility?: { hidden: ReadonlySet<string>; onToggle: (key: string) => void };
  onChange: (projects: WorkProject[]) => void;
}

const WorkProjectsFields = ({
  projects,
  shown,
  entryId,
  visibility,
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
          {visibility &&
            descriptionBullets(project.description, entryId, (id) =>
              projectBulletKey(entryId, project.id, id),
            ).map((bullet) => (
              <label
                key={bullet.key}
                className="flex items-center gap-2 text-xs"
              >
                <VisibilityCheckbox
                  label={"Include " + bullet.label}
                  checked={!visibility.hidden.has(bullet.key)}
                  onChange={() => visibility.onToggle(bullet.key)}
                />
                <span>{bullet.label}</span>
              </label>
            ))}
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
  visibility?: { hidden: ReadonlySet<string>; onToggle: (key: string) => void };
  onLogoBusyChange?: (busy: boolean) => void;
}
export const WorkFields = ({
  entry,
  patch,
  showWorkProjects,
  onLogoBusyChange,
  visibility,
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
        entryId={entry.id}
        visibility={visibility}
        shown={showWorkProjects}
        projects={entry.projects ?? []}
        onChange={(projects) => patch({ projects })}
      />
    </>
  );
};
