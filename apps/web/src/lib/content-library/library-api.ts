import {
  libraryEntrySchema,
  libraryListSchema,
  libraryStatusSchema,
  type LibraryEntry,
  type LibraryEntryContent,
} from "@ogma/contracts/content-library";

export class LibraryRequestError extends Error {
  constructor(readonly status: number) {
    super("Library request failed.");
  }
}

interface LibraryMutation {
  method: "POST" | "PATCH" | "DELETE";
  body: unknown;
}

async function requestLibrary(
  path: string,
  options?: LibraryMutation,
  signal?: AbortSignal,
) {
  const response = await fetch("/api/library" + path, {
    method: options?.method,
    headers: options ? { "Content-Type": "application/json" } : undefined,
    body: options && JSON.stringify(options.body),
    signal: signal
      ? AbortSignal.any([signal, AbortSignal.timeout(15000)])
      : AbortSignal.timeout(15000),
    cache: "no-store",
  });
  if (!response.ok) throw new LibraryRequestError(response.status);
  return (await response.json()) as unknown;
}

export async function getLibraryStatus(signal?: AbortSignal) {
  return libraryStatusSchema.parse(
    await requestLibrary("/status", undefined, signal),
  );
}

export async function loadLibrary(archived: boolean, signal?: AbortSignal) {
  return libraryListSchema.parse(
    await requestLibrary(archived ? "?archived=true" : "", undefined, signal),
  );
}

export async function saveLibraryEntry(
  id: string,
  content: LibraryEntryContent,
  revision?: number,
) {
  const response = revision
    ? await requestLibrary("/" + id, {
        method: "PATCH",
        body: { content, expectedRevision: revision },
      })
    : await requestLibrary("", { method: "POST", body: { id, content } });
  return libraryEntrySchema.parse(response);
}

export async function archiveLibraryEntry(entry: LibraryEntry) {
  return libraryEntrySchema.parse(
    await requestLibrary("/" + entry.id + "/archive", {
      method: "POST",
      body: { archived: !entry.archived, expectedRevision: entry.revision },
    }),
  );
}

export async function deleteLibraryEntry(entry: LibraryEntry) {
  await requestLibrary("/" + entry.id, {
    method: "DELETE",
    body: {
      expectedRevision: entry.revision,
      expectedArchiveToken: entry.archiveToken,
    },
  });
}
