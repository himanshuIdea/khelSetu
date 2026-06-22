import { PageBody } from "@/components/academy/shared";

function StatGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-[88px] bg-card border border-line rounded-(--radius)" />
      ))}
    </div>
  );
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-card border border-line rounded-(--radius) shadow-card overflow-hidden animate-pulse">
      <div className="h-11 bg-surface border-b border-line" />
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 px-4 py-3.5 border-b border-line2 last:border-b-0"
        >
          <div className="w-9 h-9 rounded-[9px] bg-line shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-40 bg-line rounded" />
            <div className="h-3 w-28 bg-line rounded" />
          </div>
          <div className="h-6 w-16 bg-line rounded-full" />
        </div>
      ))}
    </div>
  );
}

function PageHeaderSkeleton() {
  return (
    <div className="mb-[18px] animate-pulse">
      <div className="h-7 w-48 bg-line rounded-md" />
      <div className="h-4 w-72 bg-line rounded-md mt-2" />
    </div>
  );
}

export function StateOverviewLoading() {
  return (
    <PageBody>
      <PageHeaderSkeleton />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 mb-4 animate-pulse">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-[88px] bg-card border border-line rounded-(--radius)" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 animate-pulse">
        <div className="h-64 bg-card border border-line rounded-(--radius)" />
        <div className="h-64 bg-card border border-line rounded-(--radius)" />
      </div>
    </PageBody>
  );
}

export function StateTablePageLoading() {
  return (
    <PageBody>
      <PageHeaderSkeleton />
      <StatGridSkeleton />
      <TableSkeleton />
    </PageBody>
  );
}

export function StateReportsLoading() {
  return (
    <PageBody>
      <PageHeaderSkeleton />
      <StatGridSkeleton />
      <div className="bg-card border border-line rounded-(--radius) px-5 py-4 mt-4 animate-pulse">
        <div className="h-4 w-32 bg-line rounded-md" />
        <div className="h-3 w-48 bg-line rounded-md mt-2" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-[88px] border border-line2 rounded-(--radius)" />
          ))}
        </div>
      </div>
    </PageBody>
  );
}

export function StateDistrictsLoading() {
  return (
    <PageBody>
      <PageHeaderSkeleton />
      <TableSkeleton rows={8} />
    </PageBody>
  );
}
