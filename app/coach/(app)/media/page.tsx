import { Suspense } from "react";
import { CoachMediaWorkspace } from "@/components/coach/CoachMediaWorkspace";
import { requireCoachAccess } from "@/lib/auth/require-coach-access";
import { listCoachAssignments } from "@/lib/repositories/coaches";
import {
  countCoachPendingReviews,
  listAcademyPublishedMedia,
  listCoachDrillPosts,
  listCoachMediaFilterOptions,
  listCoachSubmissions,
} from "@/lib/repositories/coach-media";

export default async function CoachMediaPage() {
  const { academyId, coachId } = await requireCoachAccess();

  const [submissions, publishedMedia, assignments, pendingCount, myPosts] = await Promise.all([
    listCoachSubmissions(academyId, coachId),
    listAcademyPublishedMedia(academyId),
    listCoachAssignments(academyId, coachId),
    countCoachPendingReviews(academyId, coachId),
    listCoachDrillPosts(academyId, coachId),
  ]);

  const filterOptions = await listCoachMediaFilterOptions(assignments);

  return (
    <Suspense>
      <CoachMediaWorkspace
        submissions={submissions}
        publishedMedia={publishedMedia}
        filterOptions={filterOptions}
        pendingCount={pendingCount}
        academyId={academyId}
        myPostCount={myPosts.length}
      />
    </Suspense>
  );
}
