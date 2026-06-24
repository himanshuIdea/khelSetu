import { PageBody, SplitLayout } from "@/components/academy/shared";
import { PageHeaderSkeleton } from "@/components/academy/skeletons";

export default function CoachTeamsLoading() {
  return (
    <PageBody>
      <SplitLayout>
        <div className="flex-1 min-w-0 animate-pulse" aria-busy aria-label="Loading teams">
          <PageHeaderSkeleton action />
          <div className="h-[120px] bg-line rounded-(--radius) border border-line mb-4" />
          <div className="h-[280px] bg-line rounded-(--radius) border border-line" />
        </div>
      </SplitLayout>
    </PageBody>
  );
}
