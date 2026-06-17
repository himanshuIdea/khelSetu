import { PageBody, SidePanel, SplitLayout } from "@/components/academy/shared";

export default function TeamsPageLoading() {
  return (
    <PageBody>
      <SplitLayout>
        <div className="flex-1 min-w-0 animate-pulse" aria-busy aria-label="Loading teams">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
            <div className="space-y-2">
              <div className="h-7 w-40 bg-line rounded-lg" />
              <div className="h-4 w-80 max-w-full bg-line rounded" />
            </div>
            <div className="h-10 w-32 bg-line rounded-[10px] shrink-0" />
          </div>

          <div className="h-[108px] bg-line rounded-(--radius) mb-4" />

          <div className="border border-line rounded-(--radius) overflow-hidden">
            <div className="h-10 bg-line/60 border-b border-line" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3 border-b border-line2 last:border-b-0"
              >
                <div className="w-9 h-9 rounded-full bg-line shrink-0" />
                <div className="h-3.5 w-36 bg-line rounded" />
                <div className="h-3 w-16 bg-line rounded hidden sm:block" />
                <div className="h-6 w-20 bg-line rounded-full hidden md:block" />
              </div>
            ))}
          </div>
        </div>

        <SidePanel className="animate-pulse">
          <div className="bg-card border border-line rounded-(--radius) p-4 space-y-3">
            <div className="h-4 w-24 bg-line rounded" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3 items-center py-2">
                <div className="w-9 h-9 rounded-[10px] bg-line shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-32 bg-line rounded" />
                  <div className="h-3 w-24 bg-line rounded" />
                </div>
              </div>
            ))}
          </div>
        </SidePanel>
      </SplitLayout>
    </PageBody>
  );
}
