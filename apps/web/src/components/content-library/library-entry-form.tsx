"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  libraryEntryContentSchema,
  type LibraryEntryContent,
  type LibraryKind,
} from "@ogma/contracts/content-library";
import {
  AwardFields,
  CertificationFields,
  contactFields,
  EducationFields,
  inputClass,
  LanguageFields,
  ProjectFields,
  PublicationFields,
  SkillsFields,
  TextField,
  VolunteerFields,
  WorkFields,
} from "@/components/document-prototype/resume-entry-fields";
import { ResumeImageUpload } from "@/components/document-prototype/resume-image-upload";
import {
  blankLibraryValue,
  libraryContent,
  libraryValue,
  linkFields,
  type LibraryValue,
} from "@/lib/content-library/library-content";
import { LibraryRequestError } from "@/lib/content-library/library-api";

interface LibraryEntryFormProps {
  kind: LibraryKind;
  locked?: boolean;
  cachedDraft?: LibraryValue;
  onDraftChange?: (draft: LibraryValue | undefined) => void;
  entryId?: string;
  initial?: LibraryEntryContent;
  title?: string;
  onSave: (id: string, content: LibraryEntryContent) => Promise<void>;
  onCancel?: () => void;
  actions?: ReactNode;
}

const LibraryEntryForm = ({
  kind,
  locked = false,
  cachedDraft,
  onDraftChange,
  entryId,
  initial,
  title,
  actions,
  onSave,
  onCancel,
}: LibraryEntryFormProps) => {
  const [savedDraft] = useState(() =>
    initial
      ? libraryValue(entryId ?? "", initial)
      : blankLibraryValue(kind, entryId ?? ""),
  );
  const [draft, setDraft] = useState(() => cachedDraft ?? savedDraft);
  const [preparingImage, setPreparingImage] = useState(false);
  const [baseline, setBaseline] = useState(() =>
    JSON.stringify(libraryContent(savedDraft)),
  );
  const changed = JSON.stringify(libraryContent(draft)) !== baseline;
  useEffect(() => {
    onDraftChange?.(changed ? draft : undefined);
  }, [changed, draft, onDraftChange]);
  const saving = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const id = useRef(entryId);

  const fields = (() => {
    switch (draft.kind) {
      case "personal":
        return (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              {contactFields.map(([key, label, placeholder, type]) => {
                if (key === "linkedin" || key === "website" || key === "github")
                  return null;
                return (
                  <TextField
                    key={key}
                    label={label}
                    placeholder={placeholder}
                    type={type}
                    value={draft.value[key]}
                    onChange={(value) =>
                      setDraft((current) =>
                        current.kind === "personal"
                          ? {
                              ...current,
                              value: { ...current.value, [key]: value },
                            }
                          : current,
                      )
                    }
                  />
                );
              })}
              <TextField
                label="Target Title"
                placeholder="Product Designer"
                value={draft.value.targetTitle}
                onChange={(targetTitle) =>
                  setDraft({ ...draft, value: { ...draft.value, targetTitle } })
                }
              />
            </div>
            <ResumeImageUpload
              kind="photo"
              onBusyChange={setPreparingImage}
              value={draft.value.photo}
              crop={draft.value.photoCrop}
              onChange={(photo, photoCrop) => {
                setDraft((current) =>
                  current.kind === "personal"
                    ? {
                        ...current,
                        value: { ...current.value, photo, photoCrop },
                      }
                    : current,
                );
              }}
            />
          </>
        );
      case "links":
        return contactFields.map(([key, label, placeholder]) => {
          const field = linkFields.find((candidate) => candidate === key);
          if (!field) return null;
          return (
            <TextField
              key={key}
              label={label}
              placeholder={placeholder}
              value={draft.value[field]}
              onChange={(value) =>
                setDraft({
                  ...draft,
                  value: { ...draft.value, [field]: value },
                })
              }
            />
          );
        });
      case "summary":
        return (
          <label className="flex flex-col gap-1 text-xs font-semibold">
            Professional Summary
            <textarea
              className={inputClass}
              rows={5}
              maxLength={8000}
              value={draft.value.summary}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  value: { summary: event.currentTarget.value },
                })
              }
            />
          </label>
        );
      case "experience":
        return (
          <WorkFields
            entry={draft.value}
            showWorkProjects
            onLogoBusyChange={setPreparingImage}
            patch={(changes) => {
              setDraft((current) =>
                current.kind === "experience"
                  ? { ...current, value: { ...current.value, ...changes } }
                  : current,
              );
            }}
          />
        );
      case "education":
        return (
          <EducationFields
            entry={draft.value}
            patch={(changes) =>
              setDraft({ ...draft, value: { ...draft.value, ...changes } })
            }
          />
        );
      case "projects":
        return (
          <ProjectFields
            entry={draft.value}
            patch={(changes) =>
              setDraft({ ...draft, value: { ...draft.value, ...changes } })
            }
          />
        );
      case "skills":
        return (
          <SkillsFields
            entry={draft.value}
            patch={(changes) =>
              setDraft({ ...draft, value: { ...draft.value, ...changes } })
            }
          />
        );
      case "certifications":
        return (
          <CertificationFields
            entry={draft.value}
            patch={(changes) =>
              setDraft({ ...draft, value: { ...draft.value, ...changes } })
            }
          />
        );
      case "languages":
        return (
          <LanguageFields
            entry={draft.value}
            patch={(changes) =>
              setDraft({ ...draft, value: { ...draft.value, ...changes } })
            }
          />
        );
      case "awards":
        return (
          <AwardFields
            entry={draft.value}
            patch={(changes) =>
              setDraft({ ...draft, value: { ...draft.value, ...changes } })
            }
          />
        );
      case "volunteering":
        return (
          <VolunteerFields
            entry={draft.value}
            patch={(changes) =>
              setDraft({ ...draft, value: { ...draft.value, ...changes } })
            }
          />
        );
      case "publications":
        return (
          <PublicationFields
            entry={draft.value}
            patch={(changes) =>
              setDraft({ ...draft, value: { ...draft.value, ...changes } })
            }
          />
        );
    }
  })();

  return (
    <form
      className={title ? "mt-6 border-t border-line pt-6" : ""}
      onSubmit={async (event) => {
        event.preventDefault();
        if (locked || pending || preparingImage || saving.current || !changed)
          return;
        const result = libraryEntryContentSchema.safeParse(
          libraryContent(draft),
        );
        if (!result.success) {
          setError(result.error.issues[0].message);
          return;
        }
        id.current ??= crypto.randomUUID();
        saving.current = true;
        setPending(true);
        setError("");
        try {
          await onSave(id.current, result.data);
          setBaseline(JSON.stringify(libraryContent(draft)));
        } catch (error) {
          setError(
            error instanceof LibraryRequestError && error.status === 409
              ? "The Library changed in another window. Copy any unsaved text and reload before trying again."
              : "Couldn’t save this entry. Try again.",
          );
        } finally {
          saving.current = false;
          setPending(false);
        }
      }}
    >
      <fieldset
        inert={pending || locked}
        disabled={pending || locked}
        className="flex min-w-0 flex-col gap-4"
      >
        {title && (
          <legend className="mb-4 text-lg font-semibold tracking-tight">
            {title}
          </legend>
        )}
        {fields}
        {error && (
          <p role="alert" className="text-sm text-red-800">
            {error}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          {actions}
          {onCancel && (
            <button
              type="button"
              className="min-h-11 rounded-lg border border-line px-3 text-sm font-semibold hover:bg-canvas"
              onClick={onCancel}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={locked || pending || preparingImage || !changed}
            className="min-h-11 rounded-lg bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save to Library"}
          </button>
        </div>
      </fieldset>
      <p role="status" className="sr-only">
        {pending ? "Saving to Library..." : ""}
      </p>
    </form>
  );
};

export { LibraryEntryForm };
