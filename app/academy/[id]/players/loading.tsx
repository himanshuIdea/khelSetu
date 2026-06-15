import { PageBody, SplitLayout } from "@/components/academy/shared";
import { PlayerSidePanelSkeleton } from "@/components/academy/PlayerSidePanel";

export default function PlayersPageLoading() {
  return (
    <PageBody className="lg:pr-0">
      <SplitLayout className="min-w-0 w-full">
        <div className="flex-1 min-w-0 w-full animate-pulse" aria-busy aria-label="Loading players">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
            <div className="space-y-2">
              <div className="h-7 w-28 bg-line2 rounded-lg" />
              <div className="h-4 w-72 max-w-full bg-line2 rounded" />
            </div>
            <div className="h-10 w-32 bg-line2 rounded-[10px] shrink-0" />
          </div>

          <div className="w-full min-w-0 overflow-x-auto overscroll-x-contain pb-1 mb-3.5 pr-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex flex-nowrap items-center gap-[9px] w-max max-w-none pr-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-9 w-24 bg-line2 rounded-full shrink-0" />
              ))}
            </div>
          </div>

          <div className="lg:hidden border border-line rounded-(--radius) overflow-hidden min-w-0 w-full divide-y divide-line2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 px-3.5 py-3.5 min-w-0">
                <div className="w-9 h-9 rounded-[9px] bg-line2 shrink-0" />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="h-3.5 w-36 max-w-full bg-line2 rounded" />
                  <div className="h-3 w-28 max-w-full bg-line2 rounded" />
                  <div className="h-3 w-32 max-w-full bg-line2 rounded" />
                  <div className="flex gap-2 pt-1">
                    <div className="h-6 w-16 bg-line2 rounded-full shrink-0" />
                    <div className="h-6 w-20 bg-line2 rounded-full shrink-0" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden lg:block border border-line rounded-(--radius) overflow-hidden min-w-0 w-full">
            <div className="h-10 bg-line2/60 border-b border-line" />
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3 border-b border-line2 last:border-b-0 min-w-0"
              >
                <div className="w-9 h-9 rounded-[9px] bg-line2 shrink-0" />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="h-3.5 w-36 max-w-full bg-line2 rounded" />
                  <div className="h-3 w-24 max-w-full bg-line2 rounded" />
                </div>
                <div className="h-6 w-16 bg-line2 rounded-full shrink-0" />
                <div className="h-3 w-10 bg-line2 rounded shrink-0" />
                <div className="h-6 w-14 bg-line2 rounded-full shrink-0" />
              </div>
            ))}
          </div>
        </div>

        <div className="hidden lg:block">
          <PlayerSidePanelSkeleton />
        </div>
      </SplitLayout>
    </PageBody>
  );
}
