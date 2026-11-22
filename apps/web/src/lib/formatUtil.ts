const minuteMs = 60_000;
const dayMs = 86_400_000;

function dateParts(timestamp: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(timestamp);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  const year = read("year");
  return { year, day: Date.UTC(year, read("month") - 1, read("day")) };
}

export function formatLastEdited(
  iso: string,
  referenceTime: number,
  timeZone = "UTC",
) {
  const timestamp = Date.parse(iso);
  const minutes = Math.max(
    0,
    Math.floor((referenceTime - timestamp) / minuteMs),
  );
  if (minutes === 0) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;

  const edited = dateParts(timestamp, timeZone);
  const today = dateParts(referenceTime, timeZone);
  if (edited.day === today.day) return `${Math.floor(minutes / 60)} hr ago`;
  if (today.day - edited.day === dayMs) return "Yesterday";
  return formatCalendarDate(timestamp, timeZone, edited.year !== today.year);
}

function formatCalendarDate(
  timestamp: number,
  timeZone: string,
  includeYear: boolean,
) {
  return new Intl.DateTimeFormat("en", {
    timeZone,
    month: "short",
    day: "numeric",
    year: includeYear ? "numeric" : undefined,
  }).format(timestamp);
}

export function formatDateTime(iso: string, timeZone?: string) {
  return new Intl.DateTimeFormat("en", {
    timeZone,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function formatPageCount(pages: number) {
  return `${pages} ${pages === 1 ? "page" : "pages"}`;
}

export function formatResumeDetails(
  paper: "A4" | "Letter",
  templateName: string,
  pageCount: number | null | undefined,
) {
  const pages =
    pageCount === undefined
      ? "Counting pages…"
      : pageCount === null
        ? "Page count unavailable"
        : formatPageCount(pageCount);
  return `${paper} · ${templateName} · ${pages}`;
}

export function ratioToPercent(ratio: number, decimals = 0) {
  return Number((ratio * 100).toFixed(decimals));
}

export function formatPercent(ratio: number) {
  return `${ratioToPercent(ratio)}%`;
}

export function validTimeZone(value: string | undefined) {
  if (!value) return undefined;
  try {
    const decoded = decodeURIComponent(value);
    return new Intl.DateTimeFormat("en", {
      timeZone: decoded,
    }).resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
}
