import { useQueries } from "@tanstack/react-query";
import type { ResumeSummary } from "@ogma/contracts/resume-workspace";
import { pageCountQuery } from "@/lib/queries/page-count-query";

export function useResumePageCounts(rows: ResumeSummary[]) {
  const counts = useQueries({ queries: rows.map(pageCountQuery) });
  return (row: ResumeSummary) => {
    const query = counts[rows.indexOf(row)];
    return row.pageCount ?? query?.data ?? (query?.isError ? null : undefined);
  };
}
