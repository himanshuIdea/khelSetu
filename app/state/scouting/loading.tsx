import { PageBody } from "@/components/academy/shared";

function PageHeaderSkeleton() {
  return (
    <div className="mb-[18px] animate-pulse">
      <div className="h-7 w-48 bg-line rounded-md" />
      <div className="h-4 w-72 bg-line rounded-md mt-2" />
    </div>
  );
}

function FilterPillsSkeleton() {
  return (
    <div className="flex flex-wrap gap-2 mb-3.5 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-9 w-28 bg-line rounded-full" />
      ))}
    </div>
  );
}

function StatGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-[88px] bg-card border border-line rounded-(--radius)" />
      ))}
    </div>
  );
}

function ScoutingSplitSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-3.5 mt-4 min-w-0 animate-pulse">
      <div className="h-[420px] bg-card border border-line rounded-(--radius)" />
      <div className="h-[420px] bg-card border border-line rounded-(--radius)" />
    </div>
  );
}

export default function ScoutingLoading() {
  return (
    <PageBody className="overflow-x-hidden min-w-0">
      <PageHeaderSkeleton />
      <FilterPillsSkeleton />
      <StatGridSkeleton />
      <ScoutingSplitSkeleton />
    </PageBody>
  );
}
