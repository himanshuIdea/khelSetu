import { StatePageBody } from "@/components/state/StatePageBody";
import { stateLayout } from "@/lib/state-layout";

function ChromeSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,248px)] gap-2 mb-2 items-stretch animate-pulse">
      <div className="min-w-0 flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
          <div>
            <div className="h-7 w-48 bg-line rounded-md" />
            <div className="h-4 w-72 bg-line rounded-md mt-2" />
          </div>
          <div className="h-11 w-full sm:w-32 bg-line rounded-[10px] shrink-0" />
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-9 w-28 bg-line rounded-full" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[58px] bg-card border border-line rounded-(--radius)" />
          ))}
        </div>
      </div>
      <div className="h-[180px] lg:h-auto lg:min-h-[180px] bg-card border border-line rounded-(--radius)" />
    </div>
  );
}

function ScoutingListSkeleton() {
  return (
    <div className={`${stateLayout.listScrollRegion} overflow-hidden`}>
      <div className="min-w-0 min-h-0 flex flex-col flex-1 overflow-hidden animate-pulse">
        <div className="flex flex-col flex-1 min-h-0 bg-card border border-line rounded-(--radius) overflow-hidden">
          <div className="shrink-0 px-4 py-2.5 border-b border-line">
            <div className="h-4 w-52 bg-line rounded-md" />
            <div className="h-3 w-40 bg-line rounded-md mt-1" />
          </div>
          <div className="flex-1 min-h-0 p-4 space-y-3 overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
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
    </div>
  );
}

export default function ScoutingLoading() {
  return (
    <StatePageBody variant="list">
      <div className={stateLayout.listWorkspace}>
        <div className={stateLayout.listChrome}>
          <ChromeSkeleton />
        </div>
        <ScoutingListSkeleton />
      </div>
    </StatePageBody>
  );
}
