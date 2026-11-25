import type { PhotoCrop } from "@ogma/contracts/resume-content-schema";
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
import { useId } from "react";
import { type EditorSectionId } from "@/lib/document-prototype/content-presentation";
import { SectionCard, VisibilityCheckbox } from "./section-card";
import type {
  ContactInformation,
  DraftContent,
} from "../../../../../packages/contracts/resume-content";
import { EntrySection } from "./entry-section";
import { ResumeImageUpload } from "./resume-image-upload";
import { inputClass, TextField } from "@/components/ui/form-fields";
import {
  EditorControlsProvider,
  type EditorControls,
} from "./editor-controls-store";
import {
  contactFields,
  newEntry,
  emptyRange,
  emptyDescription,
  WorkFields,
  EducationFields,
  SkillsFields,
  CertificationFields,
  AwardFields,
  ProjectFields,
  VolunteerFields,
  PublicationFields,
  LanguageFields,
} from "./resume-entry-fields";

interface ResumeContentFormProps extends EditorControls {
  order: EditorSectionId[];
  onReorder: (order: EditorSectionId[]) => void;
  content: DraftContent;
  photo?: string;
  photoCrop?: PhotoCrop;
  onPhoto: (photo?: string, crop?: PhotoCrop) => void;
  showWorkProjects: boolean;
  initialPersonalDetailsOpen: boolean;
  guidance?: string;
  onChange: (content: DraftContent) => void;
}

interface PersonalDetailsDraft {
  contact: ContactInformation;
  targetTitle: string;
  photo?: string;
  photoCrop?: PhotoCrop;
}

const summarySize =
  "col-start-1 row-start-1 min-h-[calc(4lh+1rem+2px)] wrap-anywhere whitespace-pre-wrap";
const ResumeContentForm = ({
  content,
  photo,
  photoCrop,
  onPhoto,
  showWorkProjects,
  initialPersonalDetailsOpen,
  onChange,
  order,
  onReorder,
  hidden,
  onToggle,
  onDraftChange,
  titles,
  onRename,
  onPreviewChange,
  locked,
  guidance,
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
  const sections = {
    personal: (
      <SectionCard<PersonalDetailsDraft>
        section="personal"
        initialOpen={initialPersonalDetailsOpen}
        subtitle="Name, title and contact information"
        value={{
          contact: content.contact,
          targetTitle: content.targetTitle,
          photo,
          photoCrop,
        }}
        previewValue={({ photo, photoCrop, ...details }) => ({
          content: details,
          photo,
          photoCrop,
        })}
        onSave={({ photo, photoCrop, ...details }) => {
          onChange({ ...content, ...details });
          onPhoto(photo, photoCrop);
        }}
      >
        {(details, update, updateCurrent) => (
          <div className="grid grid-cols-2 gap-3">
            {contactFields.map(([key, label, placeholder, type], index) => (
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
                    placeholder={placeholder}
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
                  placeholder="Product Designer"
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
                crop={details.photoCrop}
                onChange={(photo, photoCrop) =>
                  updateCurrent((current) => ({ ...current, photo, photoCrop }))
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
        value={content.summary}
        previewValue={(summary) => ({ content: { summary } })}
        onSave={(value) => field("summary", value)}
      >
        {(value, update) => (
          <div className="grid">
            <div
              aria-hidden="true"
              className={`${inputClass} ${summarySize} invisible`}
            >
              {value + "\u200B"}
            </div>
            <textarea
              aria-label="Professional Summary"
              placeholder="Summarize your experience, strengths, and the role you’re targeting."
              className={`${inputClass} ${summarySize} resize-none self-stretch overflow-hidden`}
              rows={4}
              maxLength={8000}
              value={value}
              onChange={(event) => update(event.currentTarget.value)}
            />
          </div>
        )}
      </SectionCard>
    ),
    experience: (
      <EntrySection<DraftContent["experience"][number]>
        section="experience"
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
          <WorkFields
            entry={entry}
            patch={patch}
            showWorkProjects={showWorkProjects}
            visibility={{
              hidden,
              onToggle,
            }}
          />
        )}
      </EntrySection>
    ),
    education: (
      <EntrySection<DraftContent["education"][number]>
        section="education"
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
        {(entry, patch) => <EducationFields entry={entry} patch={patch} />}
      </EntrySection>
    ),
    skills: (
      <EntrySection<DraftContent["skills"][number]>
        section="skills"
        singular="category"
        entries={content.skills}
        update={(entries) => field("skills", entries)}
        label={(entry) => entry.category}
        makeEntry={() => ({ ...newEntry(), category: "", skills: [] })}
      >
        {(entry, patch) => (
          <SkillsFields
            entry={entry}
            patch={patch}
            visibility={{ hidden, onToggle }}
          />
        )}
      </EntrySection>
    ),
    languages: (
      <EntrySection
        section="languages"
        singular="language"
        entries={content.languages ?? []}
        update={(entries) => field("languages", entries)}
        label={(entry) => entry.name}
        makeEntry={() => ({ ...newEntry(), name: "", level: "" as const })}
      >
        {(entry, patch) => <LanguageFields entry={entry} patch={patch} />}
      </EntrySection>
    ),
    certifications: (
      <EntrySection
        section="certifications"
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
        {(entry, patch) => <CertificationFields entry={entry} patch={patch} />}
      </EntrySection>
    ),
    awards: (
      <EntrySection<DraftContent["awards"][number]>
        section="awards"
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
        {(entry, patch) => <AwardFields entry={entry} patch={patch} />}
      </EntrySection>
    ),
    projects: (
      <EntrySection<DraftContent["projects"][number]>
        section="projects"
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
        {(entry, patch) => <ProjectFields entry={entry} patch={patch} />}
      </EntrySection>
    ),
    volunteering: (
      <EntrySection
        section="volunteering"
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
        {(entry, patch) => <VolunteerFields entry={entry} patch={patch} />}
      </EntrySection>
    ),
    publications: (
      <EntrySection
        section="publications"
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
        {(entry, patch) => <PublicationFields entry={entry} patch={patch} />}
      </EntrySection>
    ),
  } satisfies Record<EditorSectionId, React.ReactNode>;
  return (
    <EditorControlsProvider
      locked={locked}
      hidden={hidden}
      onToggle={onToggle}
      titles={titles}
      onDraftChange={onDraftChange}
      onPreviewChange={onPreviewChange}
      onRename={onRename}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-2xl font-semibold tracking-tight">Content</h2>
          <p className="text-sm text-muted">
            {locked
              ? "This CV is locked. Apply section edits to the preview, then unlock to save them."
              : (guidance ??
                "Edits appear in the preview. Save each section to keep them, or Cancel to undo.")}
          </p>
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
    </EditorControlsProvider>
  );
};

export { ResumeContentForm };
