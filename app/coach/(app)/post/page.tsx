import { CoachPostDrillWorkspace } from "@/components/coach/CoachPostDrillWorkspace";
import { requireCoachAccess } from "@/lib/auth/require-coach-access";
import { listCoachAssignments } from "@/lib/repositories/coaches";
import { listCoachMediaFilterOptions } from "@/lib/repositories/coach-media";

export default async function CoachPostDrillPage() {
  const { academyId, coachId } = await requireCoachAccess();

  const assignments = await listCoachAssignments(academyId, coachId);
  const filterOptions = await listCoachMediaFilterOptions(assignments);

  return <CoachPostDrillWorkspace academyId={academyId} filterOptions={filterOptions} />;
}
