// Escape the separator and escape marker; ordinary existing IDs retain their keys.
const component = (id) => id.replace(/%/g, "%25").replace(/\//g, "%2F");
const sectionKey = (id) => "section/" + id;
const entryKey = (id) => "entry/" + component(id);
const bulletKey = (entryId, bulletId) =>
  "bullet/" + component(entryId) + "/" + component(bulletId);
const projectBulletKey = (entryId, projectId, bulletId) =>
  "project-bullet/" +
  component(entryId) +
  "/" +
  component(projectId) +
  "/" +
  component(bulletId);

function normalizeHiddenKeys(document) {
  if (document.hiddenKeyVersion === 2) return document.hidden;
  const aliases = new Map();
  const remember = (old, next) => {
    if (!aliases.has(old)) aliases.set(old, new Set());
    aliases.get(old).add(next);
  };
  const bullets = (description, oldScope, key) => {
    function visit(blocks) {
      for (const block of blocks ?? []) {
        if (block.type === "paragraph") continue;
        for (const item of block.content) {
          if (item.attrs?.id)
            remember(
              "bullet/" + oldScope + "/" + item.attrs.id,
              key(item.attrs.id),
            );
          visit(item.content);
        }
      }
    }
    visit(description?.content);
  };
  for (const kind of [
    "experience",
    "education",
    "skills",
    "languages",
    "certifications",
    "awards",
    "projects",
    "volunteering",
    "publications",
  ]) {
    for (const entry of document.content[kind] ?? []) {
      remember("entry/" + entry.id, entryKey(entry.id));
      bullets(entry.description, entry.id, (id) => bulletKey(entry.id, id));
      for (const skill of entry.skills ?? [])
        remember("entry/" + skill.id, entryKey(skill.id));
      for (const project of entry.projects ?? [])
        bullets(
          project.description,
          entry.id + "/project/" + project.id,
          (id) => projectBulletKey(entry.id, project.id, id),
        );
    }
  }
  // An ambiguous legacy key hid every matching tuple; preserve that state for each new key.
  return [
    ...new Set(
      document.hidden.flatMap((key) =>
        aliases.has(key) ? [...aliases.get(key)] : [key],
      ),
    ),
  ];
}
module.exports = {
  sectionKey,
  entryKey,
  bulletKey,
  projectBulletKey,
  normalizeHiddenKeys,
};
