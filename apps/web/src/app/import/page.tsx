import { ImportResume } from "@/components/imports/import-resume";
import { fetchOwnerApi } from "@/lib/owner-auth/server-api";
import { redirect } from "next/navigation";
import { z } from "zod";

const ImportPage = async () => {
  const response = await fetchOwnerApi("/api/auth/session").catch(() => null);
  const session = z
    .object({ signedIn: z.literal(true) })
    .safeParse(response?.ok ? await response.json().catch(() => null) : null);
  if (!session.success) redirect("/");
  return <ImportResume />;
};

export default ImportPage;
