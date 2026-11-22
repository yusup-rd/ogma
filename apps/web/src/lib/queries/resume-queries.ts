import { queryOptions, type QueryClient } from "@tanstack/react-query";
import {
  checkpointSchema,
  type ResumeSummary,
} from "@ogma/contracts/resume-workspace";
import { z } from "zod";
import {
  requestResume,
  resumeListSchema,
  ResumeRequestError,
} from "@/lib/resumes/resume-api";
import { templateCatalogSchema } from "@/lib/document-prototype/resume-layout-model";
import { queryKeys, queryFreshness } from "./query-keys";

export const resumeListQuery = (archived: boolean) =>
  queryOptions({
    queryKey: queryKeys.resumeList(archived),
    queryFn: ({ signal }) =>
      requestResume(
        archived ? "?archived=true" : "",
        resumeListSchema,
        undefined,
        signal,
      ),
    staleTime: queryFreshness.lists,
  });

export const checkpointQuery = (id: string) =>
  queryOptions({
    queryKey: queryKeys.checkpoints(id),
    queryFn: ({ signal }) =>
      requestResume(
        `/${id}/checkpoints`,
        z.array(checkpointSchema),
        undefined,
        signal,
      ),
    staleTime: queryFreshness.history,
  });

export const catalogQuery = () =>
  queryOptions({
    queryKey: queryKeys.catalog,
    queryFn: async ({ signal }) => {
      const response = await fetch("/api/resume-layouts", {
        signal: AbortSignal.any([signal, AbortSignal.timeout(15000)]),
        cache: "no-store",
      });
      if (!response.ok) throw new ResumeRequestError(response.status);
      return templateCatalogSchema.parse(await response.json());
    },
    staleTime: queryFreshness.catalog,
    gcTime: queryFreshness.catalog,
  });

export const thumbnailQuery = (id: string, revision: number) =>
  queryOptions({
    queryKey: queryKeys.thumbnail(id, revision),
    queryFn: async ({ signal }) => {
      const response = await fetch(
        `/api/resumes/${id}/thumbnail?revision=${revision}`,
        {
          signal: AbortSignal.any([signal, AbortSignal.timeout(25000)]),
          cache: "no-store",
        },
      );
      if (!response.ok) throw new ResumeRequestError(response.status);
      const html = await response.text();
      if (
        !new DOMParser()
          .parseFromString(html, "text/html")
          .querySelector(".workspace .resume-page")
      )
        throw new Error("Invalid thumbnail");
      return html;
    },
    staleTime: queryFreshness.documents,
    gcTime: queryFreshness.documents,
    refetchOnWindowFocus: false,
  });

// Cancel older reads before publishing an acknowledged write, so they cannot undo it.
export async function cacheResumeSummary(
  client: QueryClient,
  summary: ResumeSummary,
) {
  await client.cancelQueries({ queryKey: queryKeys.resumeLists });
  for (const archived of [false, true]) {
    client.setQueryData<ResumeSummary[]>(
      queryKeys.resumeList(archived),
      (rows) => {
        if (!rows) return rows;
        const remaining = rows.filter(({ id }) => id !== summary.id);
        return (
          summary.archived === archived ? [...remaining, summary] : remaining
        ).sort(
          (left, right) =>
            right.updatedAt.localeCompare(left.updatedAt) ||
            left.id.localeCompare(right.id),
        );
      },
    );
  }
  void client.invalidateQueries({
    queryKey: queryKeys.resumeLists,
    refetchType: "none",
  });
}

export async function removeCachedResume(client: QueryClient, id: string) {
  const resource = {
    predicate: (query: { queryKey: readonly unknown[] }) =>
      query.queryKey[0] === "resumes" && query.queryKey[2] === id,
  };
  await Promise.all([
    client.cancelQueries({ queryKey: queryKeys.resumeLists }),
    client.cancelQueries(resource),
  ]);
  for (const archived of [false, true])
    client.setQueryData<ResumeSummary[]>(
      queryKeys.resumeList(archived),
      (rows) => rows?.filter((row) => row.id !== id),
    );
  client.removeQueries(resource);
  void client.invalidateQueries({
    queryKey: queryKeys.resumeLists,
    refetchType: "none",
  });
}
