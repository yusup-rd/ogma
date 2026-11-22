import { cookies } from "next/headers";
import { validTimeZone } from "@/lib/formatUtil";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { createQueryClient } from "@/lib/queries/query-client";
import { queryKeys } from "@/lib/queries/query-keys";
import { z } from "zod";
import { OwnerSignIn } from "@/components/owner-auth/owner-sign-in";
import { ResumesDashboard } from "@/components/resumes/resumes-dashboard";
import { fetchOwnerApi } from "@/lib/owner-auth/server-api";
import { resumeListSchema } from "@/lib/resumes/resume-api";

interface HomePageProps {
  searchParams: Promise<{ signIn?: string | string[] }>;
}

const sessionSchema = z.object({
  signedIn: z.boolean(),
  available: z.boolean(),
});

async function loadSession() {
  const response = await fetchOwnerApi("/api/auth/session");
  if (!response.ok) throw new Error("Session check failed");
  return sessionSchema.parse(await response.json());
}

async function loadResumes() {
  const response = await fetchOwnerApi("/api/resumes");
  if (!response.ok) throw new Error("Resume list unavailable");
  return resumeListSchema.parse(await response.json());
}

async function loadDisplayClock() {
  const timeZone = validTimeZone(
    (await cookies()).get("ogma-time-zone")?.value,
  );
  return timeZone ? { now: Date.now(), timeZone } : null;
}

const HomePage = async ({ searchParams }: HomePageProps) => {
  const [session, { signIn }] = await Promise.all([
    loadSession().catch(() => null),
    searchParams,
  ]);
  if (!session) {
    return (
      <OwnerSignIn
        available={false}
        error="Couldn’t reach the workspace. Reload to try again."
      />
    );
  }
  if (session.signedIn) {
    const [resumes, initialClock] = await Promise.all([
      loadResumes().catch(() => null),
      loadDisplayClock(),
    ]);
    const queryClient = createQueryClient();
    if (resumes) queryClient.setQueryData(queryKeys.resumeList(false), resumes);
    return (
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ResumesDashboard loadFailed={!resumes} initialClock={initialClock} />
      </HydrationBoundary>
    );
  }

  let error: string | undefined;
  if (!session.available) error = "Owner sign-in is not configured.";
  else if (signIn === "unavailable")
    error = "Couldn’t start sign-in. Try again.";
  else if (signIn === "failed")
    error =
      "Couldn’t sign in. Check that you’re using the owner account and try again.";
  return <OwnerSignIn available={session.available} error={error} />;
};

export default HomePage;
