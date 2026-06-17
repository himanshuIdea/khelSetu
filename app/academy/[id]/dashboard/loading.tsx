import { PageBody } from "@/components/academy/shared";
import {
  ChartRowSkeleton,
  PageHeaderSkeleton,
  SessionsRowSkeleton,
  StatGridSkeleton,
} from "@/components/academy/skeletons";

export default function DashboardLoading() {
  return (
    <PageBody>
      <div className="space-y-4 min-w-0">
        <PageHeaderSkeleton />
        <StatGridSkeleton />
        <ChartRowSkeleton />
        <SessionsRowSkeleton />
      </div>
    </PageBody>
  );
}
