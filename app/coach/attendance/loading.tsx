import { PageBody } from "@/components/academy/shared";
import { PageHeaderSkeleton } from "@/components/academy/skeletons";

export default function CoachAttendanceLoading() {
  return (
    <PageBody>
      <div className="animate-pulse min-w-0" aria-busy aria-label="Loading attendance">
        <PageHeaderSkeleton />
        <div className="h-[140px] bg-line rounded-(--radius) border border-line mb-4" />
        <div className="h-[280px] bg-line rounded-(--radius) border border-line" />
      </div>
    </PageBody>
  );
}
