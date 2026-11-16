import { useEffect, useRef, useState } from "react";
import type { ResumeSummary } from "@ogma/contracts/resume-workspace";
import {
  getResumePageCount,
  ResumeRequestError,
} from "@/lib/resumes/resume-api";

function measurementKey(row: ResumeSummary) {
  return `${row.id}/${row.draftRevision}`;
}

export function useResumePageCounts(rows: ResumeSummary[]) {
  const [counts, setCounts] = useState<Record<string, number | null>>({});
  const completed = useRef(new Set<string>());

  useEffect(() => {
    const request = new AbortController();
    // Render older drafts one at a time to leave room for the editor and thumbnail.
    async function measureRows() {
      for (const row of rows) {
        if (request.signal.aborted) return;
        const key = measurementKey(row);
        if (row.pageCount !== null || completed.current.has(key)) continue;
        let count: number | null = null;
        try {
          const result = await getResumePageCount(row.id, request.signal).catch(
            (error: unknown) => {
              if (
                !(error instanceof ResumeRequestError) ||
                error.status !== 503
              )
                throw error;
              return new Promise((resolve) =>
                window.setTimeout(resolve, 500),
              ).then(() => getResumePageCount(row.id, request.signal));
            },
          );
          if (result.draftRevision === row.draftRevision)
            count = result.pageCount;
        } catch {
          // Leave the cache empty on a failed measurement so a reload can retry.
        }
        if (request.signal.aborted) return;
        if (count !== null) completed.current.add(key);
        setCounts((previous) => ({ ...previous, [key]: count }));
      }
    }
    void measureRows();
    return () => request.abort();
  }, [rows]);

  return (row: ResumeSummary) => row.pageCount ?? counts[measurementKey(row)];
}
