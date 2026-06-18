import { PageBody } from "@/components/academy/shared";
import { PageHeaderSkeleton } from "@/components/academy/skeletons";

export default function CoachMySubmissionsLoading() {
  return (
    <PageBody>
      <div className="animate-pulse min-w-0" aria-busy aria-label="Loading drill videos">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-[38px] h-[38px] bg-line rounded-[11px] border border-line shrink-0" />
          <div className="flex-1 min-w-0">
            <PageHeaderSkeleton />
          </div>
        </div>
        <div className="h-10 bg-line rounded-[10px] border border-line mb-4 max-w-md" />
        <div className="h-[44px] bg-line rounded-[10px] border border-line mb-4" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[56px] bg-line rounded-xl border border-line mb-[11px]" />
        ))}
      </div>
    </PageBody>
  );
}
