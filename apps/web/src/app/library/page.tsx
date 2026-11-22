import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { createQueryClient } from "@/lib/queries/query-client";
import { queryKeys } from "@/lib/queries/query-keys";
import { redirect } from "next/navigation";
import { libraryListSchema } from "@ogma/contracts/content-library";
import { ContentLibrary } from "@/components/content-library/content-library";
import { fetchOwnerApi } from "@/lib/owner-auth/server-api";

interface LibraryPageProps {
  searchParams: Promise<{ from?: string | string[] }>;
}

const LibraryPage = async ({ searchParams }: LibraryPageProps) => {
  const [response, { from }] = await Promise.all([
    fetchOwnerApi("/api/library").catch(() => null),
    searchParams,
  ]);
  if (response?.status === 401) redirect("/");
  const entries = libraryListSchema.safeParse(
    response?.ok ? await response.json().catch(() => null) : null,
  );
  const queryClient = createQueryClient();
  if (entries.success)
    queryClient.setQueryData(queryKeys.libraryList(false), entries.data);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ContentLibrary
        loadFailed={!entries.success}
        continueToResume={from === "new-resume"}
      />
    </HydrationBoundary>
  );
};

export default LibraryPage;
