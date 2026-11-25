import { queryOptions, type QueryClient } from "@tanstack/react-query";
import {
  getLibraryStatus,
  loadLibrary,
} from "@/lib/content-library/library-api";
import { queryKeys, queryFreshness } from "./query-keys";
import type { LibraryEntry } from "@ogma/contracts/content-library";

export const libraryListQuery = (archived: boolean) =>
  queryOptions({
    queryKey: queryKeys.libraryList(archived),
    queryFn: ({ signal }) => loadLibrary(archived, signal),
    staleTime: queryFreshness.lists,
  });

export const libraryStatusQuery = () =>
  queryOptions({
    queryKey: queryKeys.libraryStatus,
    queryFn: ({ signal }) => getLibraryStatus(signal),
    staleTime: queryFreshness.lists,
  });

export async function invalidateLibraryQueries(client: QueryClient) {
  await client.cancelQueries({ queryKey: queryKeys.library });
  await client.invalidateQueries({
    queryKey: queryKeys.library,
    refetchType: "none",
  });
}

export async function cacheLibraryEntry(
  client: QueryClient,
  entry: LibraryEntry,
) {
  await client.cancelQueries({ queryKey: queryKeys.library });
  for (const archived of [false, true]) {
    client.setQueryData<LibraryEntry[]>(
      queryKeys.libraryList(archived),
      (rows) => {
        if (!rows) return rows;
        const remaining = rows.filter(({ id }) => id !== entry.id);
        return entry.archived === archived ? [entry, ...remaining] : remaining;
      },
    );
  }
  await client.invalidateQueries({
    queryKey: queryKeys.library,
    refetchType: "none",
  });
}

export async function removeCachedLibraryEntry(
  client: QueryClient,
  id: string,
) {
  await client.cancelQueries({ queryKey: queryKeys.library });
  for (const archived of [false, true]) {
    client.setQueryData<LibraryEntry[]>(
      queryKeys.libraryList(archived),
      (rows) => rows?.filter((entry) => entry.id !== id),
    );
  }
  await client.invalidateQueries({
    queryKey: queryKeys.library,
    refetchType: "none",
  });
}
