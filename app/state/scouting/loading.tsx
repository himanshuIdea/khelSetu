import { StatePageBody } from "@/components/state/StatePageBody";
import { stateLayout } from "@/lib/state-layout";

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
    <div className={stateLayout.listScrollRegion}>
      <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-3.5 min-w-0 min-h-0 flex-1 overflow-x-hidden animate-pulse">
      <div className="min-w-0 min-h-0 flex flex-col flex-1">
        <div className="flex flex-col flex-1 min-h-0 bg-card border border-line rounded-(--radius) overflow-hidden">
          <div className="shrink-0 px-4 py-3 border-b border-line">
            <div className="h-4 w-52 bg-line rounded-md" />
            <div className="h-3 w-40 bg-line rounded-md mt-1.5" />
          </div>
          <div className="flex-1 min-h-0 p-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-4 h-4 bg-line rounded shrink-0" />
                <div className="w-9 h-9 rounded-[9px] bg-line shrink-0" />
                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="h-3.5 w-40 bg-line rounded" />
                  <div className="h-3 w-28 bg-line rounded" />
                </div>
                <div className="h-6 w-16 bg-line rounded-full shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="min-w-0 self-start h-fit">
        <div className="bg-card border border-line rounded-(--radius) px-[18px] py-3.5 h-[200px]" />
      </div>
      </div>
    </div>
  );
}

export default function ScoutingLoading() {
  return (
    <StatePageBody variant="list">
      <div className={stateLayout.listWorkspace}>
        <div className={stateLayout.listChrome}>
          <PageHeaderSkeleton />
          <FilterPillsSkeleton />
          <StatGridSkeleton />
        </div>
        <ScoutingSplitSkeleton />
      </div>
    </StatePageBody>
  );
}
