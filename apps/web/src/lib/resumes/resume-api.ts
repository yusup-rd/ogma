import {
  savedResumeSchema,
  resumeSummarySchema,
  type ResumeDocument,
} from "@ogma/contracts/resume-workspace";
import { z } from "zod";

export class ResumeRequestError extends Error {
  constructor(readonly status: number) {
    super("Resume request failed.");
  }
}

export const resumeListSchema = z.array(resumeSummarySchema);

interface ResumeMutation {
  method: "POST" | "PATCH" | "DELETE";
  body: unknown;
}

async function fetchResume(
  path: string,
  options?: ResumeMutation,
  signal?: AbortSignal,
) {
  const timeout = AbortSignal.timeout(
    path.includes("/analysis/") ? 70000 : 25000,
  );
  const response = await fetch(`/api/resumes${path}`, {
    method: options?.method,
    headers: options ? { "Content-Type": "application/json" } : undefined,
    body: options ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
  });
  if (!response.ok) throw new ResumeRequestError(response.status);
  return response;
}

const pageCountSchema = z.object({
  pageCount: z.int().positive(),
  draftRevision: z.int().positive(),
});

export async function getResumePageCount(id: string, signal: AbortSignal) {
  const response = await fetchResume(`/${id}/page-count`, undefined, signal);
  return pageCountSchema.parse(await response.json());
}

export async function requestResume<T>(
  path: string,
  schema: z.ZodType<T>,
  options?: ResumeMutation,
  signal?: AbortSignal,
) {
  const response = await fetchResume(path, options, signal);
  return schema.parse(await response.json());
}

export async function deleteArchivedResume(
  id: string,
  expectedRevision: number,
) {
  await fetchResume(`/${id}`, { method: "DELETE", body: { expectedRevision } });
}

export function createResume(body: {
  id: string;
  title: string;
  document?: ResumeDocument;
}) {
  return requestResume("", savedResumeSchema, { method: "POST", body });
}
