import { CoachCard } from "@/components/academy/CoachCard";
import { CoachesPageHeader } from "@/components/academy/CoachesPageHeader";
import { CapIcon } from "@/components/academy/icons";
import { PendingReviewsPanel } from "@/components/academy/PendingReviewsPanel";
import { EmptyState, PageBody, SidePanel, SplitLayout } from "@/components/academy/shared";
import {
  getCoachCount,
  getCoachFormOptions,
  getCoaches,
  getPendingReviews,
} from "@/lib/repositories/coaches";

type CoachesPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CoachesPage({ params }: CoachesPageProps) {
  const { id } = await params;

  const [coaches, pendingReviews, coachCount, formOptions] = await Promise.all([
    getCoaches(id),
    getPendingReviews(id),
    getCoachCount(id),
    getCoachFormOptions(id),
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
              description="Add coaches to assign batches, post drills and review player video submissions."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {coaches.map((coach) => (
                <CoachCard key={coach.id} coach={coach} />
              ))}
            </div>
          )}
        </div>

        <SidePanel>
          <PendingReviewsPanel reviews={pendingReviews} />
        </SidePanel>
      </SplitLayout>
    </PageBody>
  );
}
