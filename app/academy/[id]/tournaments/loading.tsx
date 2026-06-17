import { PageBody, SplitLayout, SidePanel } from "@/components/academy/shared";
import { PageHeaderSkeleton, SidePanelSkeleton } from "@/components/academy/skeletons";

export default function TournamentsPageLoading() {
  return (
    <PageBody>
      <div className="animate-pulse min-w-0" aria-busy aria-label="Loading tournaments">
        <PageHeaderSkeleton action />

        <div className="bg-card border border-line rounded-(--radius) shadow-card p-5 mb-4 flex gap-4">
          <div className="w-[54px] h-[54px] rounded-[14px] bg-line2 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-64 max-w-full bg-line2 rounded" />
            <div className="h-3 w-80 max-w-full bg-line2 rounded" />
          </div>
          <div className="h-8 w-24 bg-line2 rounded-full shrink-0 hidden sm:block" />
        </div>

        <SplitLayout>
          <div className="flex-1 min-w-0 bg-card border border-line rounded-(--radius) shadow-card p-5">
            <div className="h-4 w-48 bg-line2 rounded mb-4" />
            <div className="h-[280px] bg-line2 rounded-(--radius)" />
          </div>
          <SidePanel>
            <SidePanelSkeleton rows={3} />
          </SidePanel>
        </SplitLayout>
      </div>
    </PageBody>
  );
}
