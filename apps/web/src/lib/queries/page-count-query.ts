import { queryOptions } from "@tanstack/react-query";
import type { ResumeSummary } from "@ogma/contracts/resume-workspace";
import {
  getResumePageCount,
  ResumeRequestError,
} from "@/lib/resumes/resume-api";
import { queryKeys, queryFreshness } from "./query-keys";

// One measurement at a time leaves renderer capacity for previews and exports.
let measurementTail = Promise.resolve();

export const pageCountQuery = (row: ResumeSummary) =>
  queryOptions({
    queryKey: queryKeys.pageCount(row.id, row.draftRevision),
    queryFn: async ({ signal }) => {
      const previous = measurementTail;
      let release = () => {};
      measurementTail = new Promise<void>((resolve) => {
        release = resolve;
      });
      try {
        await previous;
        signal.throwIfAborted();
        const result = await getResumePageCount(row.id, signal);
        if (result.draftRevision !== row.draftRevision)
          throw new ResumeRequestError(409);
        return result.pageCount;
      } finally {
        release();
      }
    },
    initialData: row.pageCount ?? undefined,
    staleTime: Infinity,
    gcTime: queryFreshness.documents,
  });
