// cspell:ignore noopener noreferrer
const entities: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeText(text: string) {
  return text.replace(/[&<>"']/g, (character) => entities[character]);
}

function webHref(text: string) {
  const protocol = /^[a-z][\da-z+.-]*:/i.exec(text)?.[0];
  const hasWebProtocol = protocol !== undefined && /^https?:$/i.test(protocol);
  if (
    protocol &&
    !hasWebProtocol &&
    !/^\d+(?:[/?#]|$)/.test(text.slice(protocol.length))
  )
    return;
  const url = URL.parse(hasWebProtocol ? text : `https://${text}`);
  if (
    !url ||
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password
  )
    return;
  return url.href;
}

export function contactHref(kind: string, value: string) {
  const text = value.trim();
  if (kind === "email" && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(text)) {
    const [user, host] = text.split("@");
    return `mailto:${encodeURIComponent(user)}@${encodeURIComponent(host)}`;
  }
  if (kind === "phone" && /^\+?[\d().\s-]+$/.test(text)) {
    const number = text.replace(/[^+\d]/g, "");
    return /\d/.test(number) ? `tel:${number}` : undefined;
  }
  if (["linkedin", "website", "github"].includes(kind)) return webHref(text);
}

export function renderLink(label: string, href?: string) {
  const text = escapeText(label);
  return href
    ? `<a href="${escapeText(href)}" target="_blank" rel="noopener noreferrer">${text}</a>`
    : text;
}

// Bare domains are recognized after a Link: label, so terms like Node.js stay plain text.
export function renderLinkedText(text: string) {
  const links =
    /\b(?:https?:\/\/|www\.)[^\s<>"']+|(?<=\bLink:[ \t]{0,8})[\w-]+(?:\.[\w-]+)+(?:[/?#][^\s<>"']*)?/gi;
  let start = 0;
  let html = "";
  for (const match of text.matchAll(links)) {
    const label = match[0]
      .replace(/[.,;!?]+$/, "")
      .replace(/\)+$/, (suffix) => {
        const opens = (match[0].match(/\(/g) ?? []).length;
        const closes = (match[0].match(/\)/g) ?? []).length;
        return suffix.slice(Math.max(0, closes - opens));
      });
    html +=
      escapeText(text.slice(start, match.index)) +
      renderLink(label, webHref(label));
    start = match.index + label.length;
  }
  return html + escapeText(text.slice(start));
}
