import { PageBody, PageHeader, StatGrid } from "@/components/academy/shared";
import { PageHeaderSkeleton } from "@/components/academy/skeletons";

export default function CoachHomeLoading() {
  return (
    <PageBody>
      <div className="animate-pulse" aria-busy aria-label="Loading coach home">
        <PageHeaderSkeleton />
        <div className="h-[88px] bg-line rounded-(--radius) border border-line mb-5" />
        <StatGrid>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[88px] bg-line rounded-(--radius) border border-line" />
          ))}
        </StatGrid>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[120px] bg-line rounded-(--radius) border border-line" />
          ))}
        </div>
      </div>
    </PageBody>
  );
}
