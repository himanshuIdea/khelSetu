import { Suspense } from "react";
import { CoachMediaWorkspace } from "@/components/coach/CoachMediaWorkspace";
import { requireCoachAccess } from "@/lib/auth/require-coach-access";
import { listCoachAssignments } from "@/lib/repositories/coaches";
import {
  countCoachPendingReviews,
  listCoachMediaFilterOptions,
  listCoachSubmissions,
} from "@/lib/repositories/coach-media";

export default async function CoachMediaPage() {
  const { academyId, coachId } = await requireCoachAccess();

  const [submissions, assignments, pendingCount] = await Promise.all([
    listCoachSubmissions(academyId, coachId),
    listCoachAssignments(academyId, coachId),
    countCoachPendingReviews(academyId, coachId),
  ]);

  const filterOptions = await listCoachMediaFilterOptions(assignments);

  return (
    <Suspense>
      <CoachMediaWorkspace
        submissions={submissions}
        filterOptions={filterOptions}
        pendingCount={pendingCount}
      />
    </Suspense>
  );
}
