import { PageBody } from "@/components/academy/shared";

/** Visible on `bg-surface`; apply `animate-pulse` once on a parent wrapper. */
const skeletonBlock = "bg-line";
/** Side panel blocks sit on `bg-card`. */
const sideSkeletonBlock = "bg-line2";

type PageHeaderSkeletonProps = {
  action?: boolean;
};

export function PageHeaderSkeleton({ action = false }: PageHeaderSkeletonProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-[18px]">
      <div className="space-y-2 min-w-0">
        <div className={`h-7 w-40 max-w-full rounded-lg ${skeletonBlock}`} />
        <div className={`h-4 w-72 max-w-full rounded ${skeletonBlock}`} />
      </div>
      {action ? <div className={`h-10 w-36 rounded-[10px] shrink-0 ${skeletonBlock}`} /> : null}
    </div>
  );
}

export function StatGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 mb-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={`h-[88px] rounded-(--radius) ${skeletonBlock}`} />
      ))}
    </div>
  );
}

export function SplitLayoutSkeleton({
  main,
  side,
}: {
  main: React.ReactNode;
  side?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-5 min-w-0 w-full">
      <div className="flex-1 min-w-0">{main}</div>
      {side ? <div className="w-full lg:w-[316px] shrink-0">{side}</div> : null}
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="hidden lg:block border border-line rounded-(--radius) overflow-hidden min-w-0 w-full">
      <div className={`h-10 border-b border-line ${skeletonBlock}`} />
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 px-4 py-3 border-b border-line2 last:border-b-0 min-w-0"
        >
          <div className={`w-9 h-9 rounded-[9px] shrink-0 ${skeletonBlock}`} />
          <div className={`flex-1 h-3.5 rounded max-w-[200px] ${skeletonBlock}`} />
          <div className={`h-6 w-16 rounded-full shrink-0 ${skeletonBlock}`} />
        </div>
      ))}
    </div>
  );
}

export function CardListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="lg:hidden border border-line rounded-(--radius) overflow-hidden min-w-0 w-full divide-y divide-line2">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-start gap-3 px-3.5 py-3.5 min-w-0">
          <div className={`w-9 h-9 rounded-[9px] shrink-0 ${skeletonBlock}`} />
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className={`h-3.5 w-36 max-w-full rounded ${skeletonBlock}`} />
            <div className={`h-3 w-28 max-w-full rounded ${skeletonBlock}`} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SidePanelSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="bg-card border border-line rounded-(--radius) p-4 space-y-3 animate-pulse">
      <div className={`h-4 w-28 rounded ${sideSkeletonBlock}`} />
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex gap-3 items-center py-2">
          <div className={`w-9 h-9 rounded-[10px] shrink-0 ${sideSkeletonBlock}`} />
          <div className="flex-1 space-y-1.5">
            <div className={`h-3.5 w-32 rounded ${sideSkeletonBlock}`} />
            <div className={`h-3 w-24 rounded ${sideSkeletonBlock}`} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChartRowSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-4">
      <div className={`h-[280px] rounded-(--radius) border border-line ${skeletonBlock}`} />
      <div className={`h-[280px] rounded-(--radius) border border-line ${skeletonBlock}`} />
    </div>
  );
}

export function SessionsRowSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-4 mt-4">
      <div className={`h-[220px] rounded-(--radius) border border-line ${skeletonBlock}`} />
      <div className={`h-[220px] rounded-(--radius) border border-line ${skeletonBlock}`} />
    </div>
  );
}

export function AcademyRouteContentSkeleton() {
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
