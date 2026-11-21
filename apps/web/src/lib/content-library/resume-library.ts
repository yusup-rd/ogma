import { bulletKey, entryKey } from "@ogma/contracts/resolve-resume";
import {
  librarySections,
  singletonLibraryKinds,
  type LibraryEntry,
} from "@ogma/contracts/content-library";
import type {
  ResumeDocument,
  ResumeLibrarySource,
} from "@ogma/contracts/resume-workspace";
import type {
  RichBlock,
  RichListItem,
  RichText,
  Skill,
} from "../../../../../packages/contracts/resume-content";
import {
  libraryValue,
  richTextLines,
  type LibraryValue,
} from "./library-content";

type Choice = "resume" | "library";
type Choices = Record<string, Choice>;

interface Change {
  id: string;
  label: string;
  resume: string;
  library: string;
  defaultChoice?: Choice;
}

function readValue(
  document: ResumeDocument,
  source: LibraryValue,
): LibraryValue | undefined {
  const { content, photo, photoCrop } = document;
  const { kind, value } = source;
  switch (kind) {
    case "personal": {
      const { firstName, lastName, pronouns, email, phone, address } =
        content.contact;
      return {
        kind,
        value: {
          firstName,
          lastName,
          pronouns,
          email,
          phone,
          address,
          targetTitle: content.targetTitle,
          photo,
          photoCrop,
        },
      };
    }
    case "links": {
      const { linkedin, github, website } = content.contact;
      return { kind, value: { linkedin, github, website } };
    }
    case "summary":
      return { kind, value: { summary: content.summary } };
    default: {
      const current = content[kind]?.find(({ id }) => id === value.id);
      return current ? ({ kind, value: current } as LibraryValue) : undefined;
    }
  }
}

function writeValue(
  document: ResumeDocument,
  projection: LibraryValue,
  patch: Record<string, unknown>,
): ResumeDocument {
  const { kind, value } = projection;
  const content = { ...document.content };
  const changed = <T extends object>(value: T) => ({ ...value, ...patch });
  const put = <T extends { id: string }>(items: T[], next: T) =>
    items.some(({ id }) => id === next.id)
      ? items.map((item) => (item.id === next.id ? next : item))
      : [...items, next];
  switch (kind) {
    case "personal": {
      const { targetTitle, photo, photoCrop, ...contact } = changed(value);
      return {
        ...document,
        photo,
        photoCrop,
        content: {
          ...content,
          targetTitle,
          contact: { ...content.contact, ...contact },
        },
      };
    }
    case "links":
      content.contact = { ...content.contact, ...changed(value) };
      break;
    case "summary":
      content.summary = changed(value).summary;
      break;
    case "experience":
      content.experience = put(content.experience, changed(value));
      break;
    case "education":
      content.education = put(content.education, changed(value));
      break;
    case "projects":
      content.projects = put(content.projects, changed(value));
      break;
    case "skills":
      content.skills = put(content.skills, changed(value));
      break;
    case "languages":
      content.languages = put(content.languages ?? [], changed(value));
      break;
    case "certifications":
      content.certifications = put(content.certifications, changed(value));
      break;
    case "awards":
      content.awards = put(content.awards, changed(value));
      break;
    case "volunteering":
      content.volunteering = put(content.volunteering, changed(value));
      break;
    case "publications":
      content.publications = put(content.publications, changed(value));
      break;
  }
  return { ...document, content };
}

export function librarySources(document: ResumeDocument) {
  return (document.librarySources ?? document.experienceSources ?? []).filter(
    (source) =>
      readValue(document, libraryValue(source.entryId, source.content)),
  );
}

function withSources(
  document: ResumeDocument,
  sources: ResumeLibrarySource[],
): ResumeDocument {
  const next = { ...document, librarySources: sources };
  delete next.experienceSources;
  return next;
}

export function pruneLibrarySources(document: ResumeDocument) {
  return document.librarySources || document.experienceSources
    ? withSources(document, librarySources(document))
    : document;
}

export function canIncludeLibraryEntry(
  document: ResumeDocument,
  entry: LibraryEntry,
) {
  const { kind } = entry.content;
  if (
    entry.archived ||
    librarySources(document).some(
      (source) =>
        source.libraryId === entry.id ||
        (source.content.kind === kind && singletonLibraryKinds.includes(kind)),
    )
  )
    return false;
  const value = libraryValue(entry.id, entry.content);
  if (
    value.kind === "personal" ||
    value.kind === "links" ||
    value.kind === "summary"
  )
    return true;
  return (
    (document.content[value.kind]?.length ?? 0) < 50 &&
    !readValue(document, value)
  );
}

export function includeLibraryEntry(
  document: ResumeDocument,
  entry: LibraryEntry,
): ResumeDocument {
  if (!canIncludeLibraryEntry(document, entry)) return document;
  const incoming = libraryValue(entry.id, entry.content);
  const current = readValue(document, incoming);
  const patch = Object.fromEntries(
    Object.entries(current?.value ?? {}).filter(([, value]) => Boolean(value)),
  );
  if (current?.kind === "personal" && current.value.photo)
    patch.photoCrop = current.value.photoCrop;
  const next = writeValue(document, incoming, patch);
  return withSources(next, [
    ...librarySources(document),
    {
      entryId: entry.id,
      libraryId: entry.id,
      revision: entry.revision,
      content: entry.content,
    },
  ]);
}

function equal(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (!left || !right || typeof left !== "object" || typeof right !== "object")
    return false;
  if (Array.isArray(left) || Array.isArray(right)) {
    return (
      Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((value, index) => equal(value, right[index]))
    );
  }
  const a = Object.entries(left).filter(([, value]) => value !== undefined);
  const b = new Map(
    Object.entries(right).filter(([, value]) => value !== undefined),
  );
  return (
    a.length === b.size &&
    a.every(([key, value]) => b.has(key) && equal(value, b.get(key)))
  );
}

function valueLabel(value: unknown) {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value !== "string") return "";
  return value.startsWith("data:image/") ? "Image attached" : value;
}

function bulletItems(description: RichText): RichListItem[] {
  function items(blocks: RichBlock[]): RichListItem[] {
    return blocks.flatMap((block) =>
      block.type === "paragraph"
        ? []
        : block.content.flatMap((item) => [item, ...items(item.content)]),
    );
  }
  return items(description.content ?? []);
}

function flatBullets(description: RichText) {
  const blocks = description.content ?? [];
  if (
    blocks.every(
      (block) =>
        block.type === "bulletList" &&
        block.content.every(
          (item) => item.attrs?.id && item.content.length === 1,
        ),
    )
  )
    return bulletItems(description);
}

function itemText(item?: RichListItem) {
  return (
    (item &&
      richTextLines({ type: "doc", content: [item.content[0]] }).join("\n")) ||
    ""
  );
}

function rewriteBullets(
  blocks: RichBlock[],
  replacements: Map<string, RichListItem | undefined>,
): RichBlock[] {
  return blocks.flatMap((block): RichBlock[] => {
    if (block.type === "paragraph") return [block];
    const content = block.content.flatMap((item): RichListItem[] => {
      const [paragraph, ...children] = item.content;
      const nested = rewriteBullets(children, replacements);
      const id = item.attrs?.id;
      if (!id || !replacements.has(id))
        return [{ ...item, content: [paragraph, ...nested] }];
      const next = replacements.get(id);
      if (next) return [{ ...item, content: [next.content[0], ...nested] }];
      if (nested.some((child) => child.type === "paragraph")) {
        return [
          { type: "listItem", content: [{ type: "paragraph" }, ...nested] },
        ];
      }
      return nested.flatMap((child) =>
        child.type === "paragraph" ? [] : child.content,
      );
    });
    return content.length ? [{ ...block, content }] : [];
  });
}

function labelForField(kind: LibraryValue["kind"], key: string) {
  const special: Record<string, string> = {
    photo: "Profile photo",
    logo: "Employer logo",
    current: "Current position",
    description: "Description",
    projects: "Projects for this job",
    summary: "Professional summary",
  };
  return librarySections[kind].fields[key] ?? special[key] ?? key;
}

function prepareSync(document: ResumeDocument, incoming: LibraryEntry) {
  const source = librarySources(document).find(
    ({ libraryId }) => libraryId === incoming.id,
  );
  if (
    !source ||
    source.revision >= incoming.revision ||
    source.content.kind !== incoming.content.kind
  )
    return;
  const base = libraryValue(source.entryId, source.content);
  const latest = libraryValue(source.entryId, incoming.content);
  const current = readValue(document, base);
  if (!current) return;
  const changes: Change[] = [];
  const actions: ((
    patch: Record<string, unknown>,
    hidden: Set<string>,
    choices: Choices,
  ) => void)[] = [];
  const hidden = new Set(document.hidden);
  const review = (
    id: string,
    label: string,
    resume: string,
    library: string,
    conflict: boolean,
  ) => {
    changes.push({
      id,
      label,
      resume,
      library,
      defaultChoice: conflict ? undefined : "library",
    });
  };
  const oldFields = new Map(Object.entries(base.value));
  const nextFields = new Map(Object.entries(latest.value));
  const localFields = new Map(Object.entries(current.value));
  const collectionKeys = new Set(["id", "description", "skills", "photoCrop"]);

  for (const key of new Set([...oldFields.keys(), ...nextFields.keys()])) {
    if (collectionKeys.has(key)) continue;
    const old = oldFields.get(key);
    const next = nextFields.get(key);
    const local = localFields.get(key);
    if (key === "photo") {
      const oldPhoto = [old, oldFields.get("photoCrop")];
      const nextPhoto = [next, nextFields.get("photoCrop")];
      const localPhoto = [local, localFields.get("photoCrop")];
      if (equal(oldPhoto, nextPhoto) || equal(localPhoto, nextPhoto)) continue;
      review(
        key,
        "Profile photo",
        valueLabel(local),
        valueLabel(next),
        !equal(localPhoto, oldPhoto),
      );
      actions.push((patch, _, choices) => {
        if (choices.photo === "library") {
          patch.photo = next;
          patch.photoCrop = nextPhoto[1];
        }
      });
      continue;
    }
    if (equal(old, next) || equal(local, next)) continue;
    const format = (value: unknown) =>
      key === "projects" && Array.isArray(value)
        ? value
            .map(({ name, description }) =>
              [name, ...richTextLines(description)].filter(Boolean).join(" — "),
            )
            .join("\n")
        : valueLabel(value);
    review(
      key,
      labelForField(base.kind, key),
      format(local),
      format(next),
      !equal(local, old),
    );
    actions.push((patch, _, choices) => {
      if (choices[key] === "library") patch[key] = next;
    });
  }

  if (
    "description" in base.value &&
    "description" in latest.value &&
    "description" in current.value
  ) {
    const old = base.value.description;
    const local = current.value.description;
    const next = latest.value.description;
    if (!equal(old, next) && !equal(local, next)) {
      const oldBullets = flatBullets(old);
      const nextBullets = flatBullets(next);
      if (
        oldBullets &&
        nextBullets &&
        (oldBullets.length || nextBullets.length)
      ) {
        const previous = new Map(
          oldBullets.map((item) => [item.attrs?.id, item]),
        );
        const updates = new Map(
          nextBullets.map((item) => [item.attrs?.id, item]),
        );
        const existing = new Map(
          bulletItems(local).map((item) => [item.attrs?.id, item]),
        );
        const candidates = new Map<string, RichListItem | undefined>();
        for (const id of new Set([...previous.keys(), ...updates.keys()])) {
          if (!id) continue;
          const old = previous.get(id);
          const next = updates.get(id);
          const local = existing.get(id);
          if (
            equal(old?.content[0], next?.content[0]) ||
            equal(local?.content[0], next?.content[0])
          )
            continue;
          const removed =
            !next &&
            Boolean(local) &&
            !hidden.has(bulletKey(source.entryId, id));
          review(
            "bullet:" + id,
            !old ? "New bullet (unchecked)" : "Reusable bullet",
            itemText(local),
            itemText(next),
            removed || !equal(local?.content[0], old?.content[0]),
          );
          candidates.set(id, next);
        }
        actions.push((patch, hidden, choices) => {
          const chosen = new Map(
            [...candidates].filter(
              ([id]) => choices["bullet:" + id] === "library",
            ),
          );
          const content = rewriteBullets(local.content ?? [], chosen);
          const added = [];
          for (const [id, next] of chosen) {
            const key = bulletKey(source.entryId, id);
            if (!next) hidden.delete(key);
            else if (!existing.has(id)) {
              hidden.add(key);
              added.push(next);
            }
          }
          if (added.length)
            content.push({ type: "bulletList", content: added });
          if (chosen.size) patch.description = { type: "doc", content };
        });
      } else {
        const oldIds = new Set(bulletItems(old).map((item) => item.attrs?.id));
        const nextIds = new Set(
          bulletItems(next).map((item) => item.attrs?.id),
        );
        const selectedRemoval = bulletItems(local).some(
          ({ attrs }) =>
            attrs?.id &&
            oldIds.has(attrs.id) &&
            !nextIds.has(attrs.id) &&
            !hidden.has(bulletKey(source.entryId, attrs.id)),
        );
        review(
          "description",
          "Description",
          richTextLines(local).join("\n"),
          richTextLines(next).join("\n"),
          selectedRemoval || !equal(local, old),
        );
        actions.push((patch, hidden, choices) => {
          if (choices.description !== "library") return;
          patch.description = next;
          for (const id of nextIds)
            if (id && !oldIds.has(id))
              hidden.add(bulletKey(source.entryId, id));
        });
      }
    }
  }

  if (
    base.kind === "skills" &&
    current.kind === "skills" &&
    latest.kind === "skills"
  ) {
    const items = (skills: Skill[]) =>
      new Map(skills.map((skill) => [skill.id, skill]));
    const old = items(base.value.skills);
    const local = items(current.value.skills);
    const next = items(latest.value.skills);
    const format = (skill?: Skill) =>
      skill ? [skill.name, skill.level].filter(Boolean).join(" · ") : "";
    const candidates = new Map<string, Skill | undefined>();
    for (const id of new Set([...old.keys(), ...next.keys()])) {
      const before = old.get(id);
      const here = local.get(id);
      const incoming = next.get(id);
      if (equal(before, incoming) || equal(here, incoming)) continue;
      review(
        "skill:" + id,
        before ? "Skill" : "New skill (unchecked)",
        format(here),
        format(incoming),
        !equal(before, here) ||
          (!incoming && Boolean(here) && !hidden.has(entryKey(id))),
      );
      candidates.set(id, incoming);
    }
    actions.push((patch, hidden, choices) => {
      for (const [id, value] of candidates) {
        if (choices["skill:" + id] !== "library") continue;
        if (value) {
          if (!local.has(id)) hidden.add(entryKey(id));
          local.set(id, value);
        } else {
          local.delete(id);
          hidden.delete(entryKey(id));
        }
      }
      patch.skills = [...local.values()];
    });
  }

  return {
    changes,
    apply(choices: Choices) {
      const patch = {};
      for (const action of actions) action(patch, hidden, choices);
      const next = {
        ...writeValue(document, current, patch),
        hidden: [...hidden],
      };
      return withSources(
        next,
        librarySources(document).map((item) =>
          item.libraryId === source.libraryId
            ? {
                ...item,
                revision: incoming.revision,
                content: incoming.content,
              }
            : item,
        ),
      );
    },
  };
}

export function reviewLibraryEntry(
  document: ResumeDocument,
  incoming: LibraryEntry,
) {
  return prepareSync(document, incoming)?.changes;
}

export function syncLibraryEntry(
  document: ResumeDocument,
  incoming: LibraryEntry,
  choices: Choices,
): ResumeDocument {
  const plan = prepareSync(document, incoming);
  if (!plan || plan.changes.some(({ id }) => choices[id] === undefined))
    return document;
  return plan.apply(choices);
}
