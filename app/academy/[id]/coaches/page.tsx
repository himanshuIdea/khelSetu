import { CoachCard } from "@/components/academy/CoachCard";
import { PendingReviewsPanel } from "@/components/academy/PendingReviewsPanel";
import {
  PageBody,
  PageHeader,
  SidePanel,
  SplitLayout,
} from "@/components/academy/shared";
import { api } from "@/lib/api";
import { resolveAcademy } from "@/lib/repositories/resolve-academy";

export const dynamic = "force-dynamic";

type CoachesPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CoachesPage({ params }: CoachesPageProps) {
  const { id } = await params;
  const academy = await resolveAcademy(id);

  const [coaches, pendingReviews, coachCountResult] = await Promise.all([
    api.coaches.list(academy.id),
    api.coaches.pendingReviews(academy.id),
    api.coaches.count(academy.id),
  ]);
  const coachCount = coachCountResult.count;

  return (
    <PageBody>
      <SplitLayout>
        <div className="flex-1 min-w-0">
          <PageHeader
            title="Coaches"
            subtitle={`${coachCount} coaches across 5 sports · assign batches, post drills, review submissions.`}
            actionLabel="Add coach"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coaches.map((coach) => (
              <CoachCard key={coach.initials} coach={coach} />
            ))}
          </div>
        </div>

        <SidePanel>
          <PendingReviewsPanel reviews={pendingReviews} />
        </SidePanel>
      </SplitLayout>
    </PageBody>
  );
}
