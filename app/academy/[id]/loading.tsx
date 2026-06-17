import { PageBody } from "@/components/academy/shared";
import { ChartRowSkeleton, PageHeaderSkeleton, StatGridSkeleton } from "@/components/academy/skeletons";

export default function AcademyPageLoading() {
  return (
    <PageBody>
      <div className="animate-pulse space-y-4 min-w-0" aria-busy aria-label="Loading page">
        <PageHeaderSkeleton />
        <StatGridSkeleton />
        <ChartRowSkeleton />
      </div>
    </PageBody>
  );
}
