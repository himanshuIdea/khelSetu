import { notFound } from "next/navigation";
import { CoachSubmissionReviewWorkspace } from "@/components/coach/CoachSubmissionReviewWorkspace";
import { requireCoachAccess } from "@/lib/auth/require-coach-access";
import { getCoachSubmissionDetail } from "@/lib/repositories/coach-media";

type PageProps = {
  params: Promise<{ submissionId: string }>;
};

export default async function CoachSubmissionReviewPage({ params }: PageProps) {
  const { submissionId } = await params;
  const { academyId, coachId } = await requireCoachAccess();

  const submission = await getCoachSubmissionDetail(submissionId, coachId);
  if (!submission) {
    notFound();
  }

  return <CoachSubmissionReviewWorkspace academyId={academyId} submission={submission} />;
}
