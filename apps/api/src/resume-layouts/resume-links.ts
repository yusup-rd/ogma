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
    (!url.hostname.includes(".") && !url.hostname.startsWith("[")) ||
    url.username ||
    url.password
  )
    return;
  return url.href;
}

export function displayWebUrl(value: string, preserveTrailingSlash = false) {
  const href = webHref(value.trim());
  if (!href) return value.trim();
  const url = new URL(href);
  const pathname = preserveTrailingSlash
    ? url.pathname
    : url.pathname.replace(/\/+$/, "");
  return `${url.host}${pathname}${url.search}${url.hash}`;
}

export function contactLabel(kind: string, value: string) {
  return ["linkedin", "website", "github"].includes(kind)
    ? displayWebUrl(value)
    : value;
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
export function linkedTextParts(text: string) {
  const links =
    /\b(?:https?:\/\/|www\.)[^\s<>"']+|(?<=\bLink:[ \t]{0,8})[\w-]+(?:\.[\w-]+)+(?:[/?#][^\s<>"']*)?/gi;
  let start = 0;
  const parts: { text: string; href?: string }[] = [];
  for (const match of text.matchAll(links)) {
    const label = match[0]
      .replace(/[.,;!?]+$/, "")
      .replace(/\)+$/, (suffix) => {
        const opens = (match[0].match(/\(/g) ?? []).length;
        const closes = (match[0].match(/\)/g) ?? []).length;
        return suffix.slice(Math.max(0, closes - opens));
      });
    const href = webHref(label);
    parts.push(
      { text: text.slice(start, match.index) },
      {
        text: href ? displayWebUrl(label, true) : label,
        href,
      },
    );
    start = match.index + label.length;
  }
  parts.push({ text: text.slice(start) });
  return parts;
}

export function renderLinkedText(text: string) {
  return linkedTextParts(text)
    .map((part) => renderLink(part.text, part.href))
    .join("");
}
