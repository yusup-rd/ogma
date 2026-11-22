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
  return (
    <ContentLibrary
      initialEntries={entries.success ? entries.data : []}
      loadFailed={!entries.success}
      continueToResume={from === "new-resume"}
    />
  );
};

export default LibraryPage;
