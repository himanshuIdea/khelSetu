import { PageBody, PageHeader, StatGrid } from "@/components/academy/shared";
import { PageHeaderSkeleton } from "@/components/academy/skeletons";

export default function CoachMediaLoading() {
  return (
    <PageBody>
      <div className="animate-pulse min-w-0" aria-busy aria-label="Loading media">
        <PageHeaderSkeleton />
        <div className="mb-5">
          <StatGrid>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[88px] bg-line rounded-(--radius) border border-line" />
            ))}
          </StatGrid>
        </div>
        <div className="h-10 bg-line rounded-[10px] border border-line mb-4 max-w-md" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="h-[44px] bg-line rounded-[10px] border border-line" />
          <div className="h-[44px] bg-line rounded-[10px] border border-line" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[56px] bg-line rounded-xl border border-line mb-[11px]" />
        ))}
      </div>
    </PageBody>
  );
}
