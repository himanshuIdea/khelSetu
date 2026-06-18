import { CoachesGrid } from "@/components/academy/CoachesGrid";
import { CoachesPageHeader } from "@/components/academy/CoachesPageHeader";
import { CapIcon } from "@/components/academy/icons";
import { PendingReviewsPanel } from "@/components/academy/PendingReviewsPanel";
import { EmptyState, PageBody, SidePanel, SplitLayout } from "@/components/academy/shared";
import {
  getAssignCoachFormOptions,
  getCoachCount,
  getCoaches,
  getPendingReviews,
} from "@/lib/repositories/coaches";
import { resolveAcademy } from "@/lib/repositories/resolve-academy";

type CoachesPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CoachesPage({ params }: CoachesPageProps) {
  const { id } = await params;

  const [, coaches, pendingReviews, coachCount, formOptions] = await Promise.all([
    resolveAcademy(id),
    getCoaches(id),
    getPendingReviews(id),
    getCoachCount(id),
    getAssignCoachFormOptions(id),
  ]);
  const sportCount = formOptions.sports.length;

  return (
    <PageBody>
      <SplitLayout>
        <div className="flex-1 min-w-0">
          <CoachesPageHeader
            academyId={id}
            subtitle={`${coachCount} coaches across ${sportCount} sports · assign batches, post drills, review submissions.`}
            formOptions={formOptions}
          />

          {coaches.length === 0 ? (
            <EmptyState
              icon={<CapIcon className="w-5 h-5" />}
              title="No coaches yet"
              description="Add coaches from Fees → Manage staff, then assign them to batches here."
            />
          ) : (
            <CoachesGrid academyId={id} coaches={coaches} formOptions={formOptions} />
          )}
        </div>

        <SidePanel>
          <PendingReviewsPanel reviews={pendingReviews} />
        </SidePanel>
      </SplitLayout>
    </PageBody>
  );
}
