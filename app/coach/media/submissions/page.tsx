import { Suspense } from "react";
import { CoachMySubmissionsWorkspace } from "@/components/coach/CoachMySubmissionsWorkspace";
import { requireCoachAccess } from "@/lib/auth/require-coach-access";
import { listCoachAssignments } from "@/lib/repositories/coaches";
import {
  listCoachDrillPosts,
  listCoachMediaFilterOptions,
} from "@/lib/repositories/coach-media";

export default async function CoachMySubmissionsPage() {
  const { academyId, coachId } = await requireCoachAccess();

  const [posts, assignments] = await Promise.all([
    listCoachDrillPosts(academyId, coachId),
    listCoachAssignments(academyId, coachId),
  ]);

  const filterOptions = await listCoachMediaFilterOptions(assignments);

  return (
    <Suspense>
      <CoachMySubmissionsWorkspace
        academyId={academyId}
        posts={posts}
        filterOptions={filterOptions}
      />
    </Suspense>
  );
}
