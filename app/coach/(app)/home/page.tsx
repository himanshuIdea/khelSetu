import { CoachHomeWorkspace } from "@/components/coach/CoachHomeWorkspace";
import { requireCoachAccess } from "@/lib/auth/require-coach-access";
import { getCoachHomeSummary } from "@/lib/repositories/coaches";

export default async function CoachHomePage() {
  const { academyId, coachId } = await requireCoachAccess();

  const summary = await getCoachHomeSummary(academyId, coachId);

  return <CoachHomeWorkspace academyId={academyId} summary={summary} />;
}
