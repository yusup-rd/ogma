export const queryKeys = {
  resumes: ["resumes"] as const,
  resumeLists: ["resumes", "list"] as const,
  resumeList: (archived: boolean) => ["resumes", "list", archived] as const,
  pageCount: (id: string, revision: number) =>
    ["resumes", "page-count", id, revision] as const,
  thumbnail: (id: string, revision: number) =>
    ["resumes", "thumbnail", id, revision] as const,
  checkpoints: (id: string) => ["resumes", "checkpoints", id] as const,
  library: ["library"] as const,
  libraryList: (archived: boolean) => ["library", "list", archived] as const,
  libraryStatus: ["library", "status"] as const,
  catalog: ["template-catalog"] as const,
};

export const queryFreshness = {
  lists: 60_000,
  history: 30_000,
  documents: 5 * 60_000,
  catalog: 60 * 60_000,
};
