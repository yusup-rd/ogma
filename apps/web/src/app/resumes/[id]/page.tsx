import { notFound, redirect } from "next/navigation";
import { savedResumeSchema } from "@ogma/contracts/resume-workspace";
import { z } from "zod";
import { DocumentWorkspace } from "@/components/document-prototype/document-workspace";
import { fetchOwnerApi } from "@/lib/owner-auth/server-api";

interface ResumePageProps {
  params: Promise<{ id: string }>;
}

const ResumePage = async ({ params }: ResumePageProps) => {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const response = await fetchOwnerApi(`/api/resumes/${id}`);
  if (response.status === 401) redirect("/");
  if (response.status === 404) notFound();
  if (!response.ok) throw new Error("Resume unavailable");
  const resume = savedResumeSchema.parse(await response.json());
  return (
    <DocumentWorkspace
      key={`${resume.id}:${resume.draftRevision}`}
      resume={resume}
    />
  );
};

export default ResumePage;
