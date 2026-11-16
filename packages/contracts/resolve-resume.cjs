const sectionKey = (id) => "section/" + id;
const entryKey = (id) => "entry/" + id;
const bulletKey = (entryId, bulletId) => "bullet/" + entryId + "/" + bulletId;

function visibleDescription(value, entryId, hidden) {
  function filter(block) {
    if (block.type === "paragraph") return [block];
    const content = block.content.flatMap((item) => {
      const id = item.attrs?.id;
      if (id && hidden.has(bulletKey(entryId, id))) return [];
      const [paragraph, ...children] = item.content;
      return [{ ...item, content: [paragraph, ...children.flatMap(filter)] }];
    });
    return content.length ? [{ ...block, content }] : [];
  }
  return { ...value, content: value.content?.flatMap(filter) };
}

function visibleResume(content, hidden) {
  if (!hidden.size) return content;
  const entries = (id, values) =>
    hidden.has(sectionKey(id))
      ? []
      : values.filter((entry) => !hidden.has(entryKey(entry.id)));
  const described = (id, values) =>
    entries(id, values).map((entry) => ({
      ...entry,
      description: visibleDescription(entry.description, entry.id, hidden),
    }));
  const hidePersonal = hidden.has(sectionKey("personal"));
  const contact = { ...content.contact };
  for (const key of Object.keys(contact)) {
    if (hidePersonal || hidden.has("contact/" + key)) contact[key] = "";
  }
  return {
    contact,
    targetTitle:
      hidePersonal || hidden.has("contact/targetTitle")
        ? ""
        : content.targetTitle,
    summary: hidden.has(sectionKey("summary")) ? "" : content.summary,
    experience: described("experience", content.experience),
    education: described("education", content.education),
    skills: entries("skills", content.skills).map((category) => ({
      ...category,
      skills: entries("skills", category.skills),
    })),
    certifications: entries("certifications", content.certifications),
    awards: entries("awards", content.awards),
    projects: described("projects", content.projects),
    volunteering: described("volunteering", content.volunteering),
    publications: described("publications", content.publications),
  };
}

function defaultStyle(template) {
  const { font, accent, bodySize, sectionGap, margin, lineHeight, photo } =
    template;
  return {
    font,
    accent,
    bodySize,
    sectionGap,
    margin,
    lineHeight,
    showPhoto: photo !== "none",
  };
}

function resolveResume(document, template) {
  const hidden = new Set(document.hidden);
  const style = document.settings[template.id] ?? defaultStyle(template);
  return {
    layoutId: template.id,
    sectionOrder: document.sectionOrder?.filter(
      (section) => section !== "personal",
    ),
    content: visibleResume(document.content, hidden),
    style: {
      ...style,
      showPhoto: style.showPhoto && !hidden.has(sectionKey("personal")),
    },
    photo: document.photo,
  };
}

module.exports = {
  sectionKey,
  entryKey,
  bulletKey,
  defaultStyle,
  resolveResume,
};
