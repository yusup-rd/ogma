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
  photos?: { resume?: string; library?: string };
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
  const valid = (blocks: RichBlock[]): boolean =>
    blocks.every(
      (block) =>
        block.type === "paragraph" ||
        (block.type === "bulletList" &&
          block.content.every((item) => item.attrs?.id && valid(item.content))),
    );
  if (valid(description.content ?? [])) return bulletItems(description);
}

function bulletPositions(description: RichText, ids: Set<string>) {
  const positions = new Map<string, string>();
  function visit(blocks: RichBlock[], parent: string) {
    let paragraphs = 0;
    for (const block of blocks) {
      if (block.type === "paragraph") {
        paragraphs++;
        continue;
      }
      for (const item of block.content) {
        const id = item.attrs?.id ?? "";
        if (ids.has(id))
          positions.set(id, `${parent}:${paragraphs}:${block.type}`);
        visit(item.content, id);
      }
    }
  }
  visit(description.content ?? [], "root");
  return [...positions].sort(([a], [b]) => a.localeCompare(b));
}

function ownParagraphs(item?: RichListItem) {
  return item?.content.filter((block) => block.type === "paragraph");
}

function itemText(item?: RichListItem) {
  return richTextLines({
    type: "doc",
    content: ownParagraphs(item) ?? [],
  }).join("\n");
}

function insertBullet(
  blocks: RichBlock[],
  item: RichListItem,
  incoming: RichText,
) {
  function locate(
    children: RichBlock[],
    parent?: string,
  ): { parent?: string; index: number; peers: Set<string> } | undefined {
    for (const [index, block] of children.entries()) {
      if (block.type === "paragraph") continue;
      if (
        block.content.some(
          (candidate) => candidate.attrs?.id === item.attrs?.id,
        )
      )
        return {
          parent,
          index,
          peers: new Set(
            block.content.map((candidate) => candidate.attrs?.id ?? ""),
          ),
        };
      for (const candidate of block.content) {
        const found = locate(candidate.content, candidate.attrs?.id);
        if (found) return found;
      }
    }
  }
  const position = locate(incoming.content ?? []);
  if (!position) return;
  const parent = position.parent
    ? bulletItems({ type: "doc", content: blocks }).find(
        (candidate) => candidate.attrs?.id === position.parent,
      )
    : undefined;
  if (position.parent && !parent) return;
  const children = parent?.content ?? blocks;
  const list = children.find(
    (block) =>
      block.type === "bulletList" &&
      block.content.some((candidate) =>
        position.peers.has(candidate.attrs?.id ?? ""),
      ),
  );
  if (list && list.type === "bulletList") {
    const order = [...position.peers];
    const rank = order.indexOf(item.attrs?.id ?? "");
    const after = list.content.findIndex(
      (candidate) => order.indexOf(candidate.attrs?.id ?? "") > rank,
    );
    list.content.splice(after < 0 ? list.content.length : after, 0, item);
  } else {
    children.splice(Math.min(position.index, children.length), 0, {
      type: "bulletList",
      content: [item],
    });
  }
}

function rewriteBullets(
  blocks: RichBlock[],
  replacements: Map<string, RichListItem | undefined>,
): RichBlock[] {
  return blocks.flatMap((block): RichBlock[] => {
    if (block.type === "paragraph") return [block];
    const content = block.content.flatMap((item): RichListItem[] => {
      const paragraphs = ownParagraphs(item) ?? [];
      const nested = rewriteBullets(
        item.content.filter((child) => child.type !== "paragraph"),
        replacements,
      );
      const id = item.attrs?.id;
      if (!id || !replacements.has(id))
        return [
          {
            ...item,
            content: [item.content[0], ...paragraphs.slice(1), ...nested],
          },
        ];
      const next = replacements.get(id);
      if (next)
        return [
          {
            ...item,
            content: [
              next.content[0],
              ...(ownParagraphs(next)?.slice(1) ?? []),
              ...nested,
            ],
          },
        ];
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
      changes[changes.length - 1].photos = {
        resume: typeof local === "string" ? local : undefined,
        library: typeof next === "string" ? next : undefined,
      };
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
      const localBullets = flatBullets(local);
      const sharedIds = new Set(
        bulletItems(old)
          .map((item) => item.attrs?.id)
          .filter(
            (id): id is string =>
              Boolean(id) &&
              bulletItems(next).some((item) => item.attrs?.id === id),
          ),
      );
      const positionChanged = !equal(
        bulletPositions(old, sharedIds),
        bulletPositions(next, sharedIds),
      );
      const nestedOrderChanged = (value: RichText) =>
        (value.content ?? []).some(
          (block) =>
            block.type !== "paragraph" &&
            block.content.some((item) => item.content.length > 1),
        );
      const sharedSequence = (value: RichText) =>
        bulletItems(value)
          .map((item) => item.attrs?.id)
          .filter((id): id is string => Boolean(id) && sharedIds.has(id!));
      const reorderedNested =
        (nestedOrderChanged(old) ||
          nestedOrderChanged(next) ||
          nestedOrderChanged(local)) &&
        !equal(sharedSequence(old), sharedSequence(next));
      if (
        !positionChanged &&
        !reorderedNested &&
        oldBullets &&
        nextBullets &&
        localBullets &&
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
        const order = (items: RichListItem[]) =>
          items.map((item) => item.attrs!.id!);
        const oldOrder = order(oldBullets);
        const nextOrder = order(nextBullets);
        const localOrder = order(localBullets);
        const shared = new Set(
          oldOrder.filter(
            (id) => nextOrder.includes(id) && localOrder.includes(id),
          ),
        );
        const sharedOrder = (ids: string[]) =>
          ids.filter((id) => shared.has(id));
        const orderChanged = !equal(
          sharedOrder(oldOrder),
          sharedOrder(nextOrder),
        );
        if (orderChanged) {
          review(
            "bullet-order",
            "Bullet order",
            localBullets.map(itemText).join("\n"),
            nextBullets.map(itemText).join("\n"),
            !equal(sharedOrder(localOrder), sharedOrder(oldOrder)),
          );
        }
        const paragraphs = (value: RichText) =>
          (value.content ?? []).filter((block) => block.type === "paragraph");
        const oldParagraphs = paragraphs(old);
        const nextParagraphs = paragraphs(next);
        const localParagraphs = paragraphs(local);
        const proseChanged =
          !equal(oldParagraphs, nextParagraphs) &&
          !equal(localParagraphs, nextParagraphs);
        if (proseChanged) {
          review(
            "description-text",
            "Description text",
            richTextLines({ type: "doc", content: localParagraphs }).join("\n"),
            richTextLines({ type: "doc", content: nextParagraphs }).join("\n"),
            !equal(localParagraphs, oldParagraphs),
          );
        }
        const candidates = new Map<string, RichListItem | undefined>();
        for (const id of new Set([...previous.keys(), ...updates.keys()])) {
          if (!id) continue;
          const old = previous.get(id);
          const next = updates.get(id);
          const local = existing.get(id);
          if (
            equal(ownParagraphs(old), ownParagraphs(next)) ||
            equal(ownParagraphs(local), ownParagraphs(next))
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
            removed || !equal(ownParagraphs(local), ownParagraphs(old)),
          );
          candidates.set(id, next);
        }
        actions.push((patch, hidden, choices) => {
          const chosen = new Map(
            [...candidates].filter(
              ([id]) => choices["bullet:" + id] === "library",
            ),
          );
          let content = rewriteBullets(local.content ?? [], chosen);
          const added: RichListItem[] = [];
          for (const [id, next] of chosen) {
            const key = bulletKey(source.entryId, id);
            if (!next) hidden.delete(key);
            else if (!existing.has(id)) {
              hidden.add(key);
              added.push({
                ...next,
                content: [
                  next.content[0],
                  ...(ownParagraphs(next)?.slice(1) ?? []),
                ],
              });
            }
          }
          for (const item of added) insertBullet(content, item, next);
          if (orderChanged && choices["bullet-order"] === "library") {
            const ordered = content
              .flatMap((block) =>
                block.type === "bulletList" ? block.content : [],
              )
              .filter((item) => nextOrder.includes(item.attrs?.id ?? ""))
              .sort(
                (a, b) =>
                  nextOrder.indexOf(a.attrs!.id!) -
                  nextOrder.indexOf(b.attrs!.id!),
              );
            let cursor = 0;
            content = content.map((block) =>
              block.type === "bulletList"
                ? {
                    ...block,
                    content: block.content.map((item) =>
                      nextOrder.includes(item.attrs?.id ?? "")
                        ? ordered[cursor++]
                        : item,
                    ),
                  }
                : block,
            );
          }
          if (proseChanged && choices["description-text"] === "library") {
            let cursor = 0;
            content = content.flatMap((block): RichBlock[] =>
              block.type === "paragraph"
                ? cursor < nextParagraphs.length
                  ? [nextParagraphs[cursor++]]
                  : []
                : [block],
            );
            content.push(...nextParagraphs.slice(cursor));
          }
          if (
            chosen.size ||
            choices["bullet-order"] === "library" ||
            choices["description-text"] === "library"
          )
            patch.description = { type: "doc", content };
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
      if (before && here && incoming) {
        for (const field of ["name", "level"] as const) {
          if (
            equal(before[field], incoming[field]) ||
            equal(here[field], incoming[field])
          )
            continue;
          const choice = "skill:" + id + ":" + field;
          review(
            choice,
            field === "name" ? "Skill name" : "Skill proficiency",
            here[field],
            incoming[field],
            !equal(before[field], here[field]),
          );
          actions.push((patch, _, choices) => {
            if (choices[choice] === "library")
              local.set(id, { ...local.get(id)!, [field]: incoming[field] });
          });
        }
        continue;
      }
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
