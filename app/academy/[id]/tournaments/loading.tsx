import { PageBody, SplitLayout, SidePanel } from "@/components/academy/shared";
import { PageHeaderSkeleton } from "@/components/academy/skeletons";

export default function TournamentsPageLoading() {
  return (
    <PageBody className="flex flex-col min-h-0 max-h-[calc(100dvh-66px)] lg:overflow-hidden">
      <div className="flex flex-col flex-1 min-h-0 min-w-0 w-full animate-pulse" aria-busy aria-label="Loading tournaments">
        <PageHeaderSkeleton action />

        <div className="bg-card border border-line rounded-(--radius) shadow-card p-5 mb-4 flex gap-4">
          <div className="w-[54px] h-[54px] rounded-[14px] bg-line2 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-64 max-w-full bg-line2 rounded" />
            <div className="h-3 w-80 max-w-full bg-line2 rounded" />
          </div>
          <div className="h-8 w-24 bg-line2 rounded-full shrink-0 hidden sm:block" />
        </div>

        <SplitLayout className="flex-1 min-h-0 lg:overflow-hidden">
          <div className="flex-1 min-w-0 min-h-0 bg-card border border-line rounded-(--radius) shadow-card p-5 lg:overflow-y-auto">
            <div className="h-4 w-48 bg-line2 rounded mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="h-[140px] bg-line2 rounded-(--radius)" />
              <div className="h-[140px] bg-line2 rounded-(--radius)" />
              <div className="h-[140px] bg-line2 rounded-(--radius)" />
              <div className="h-[140px] bg-line2 rounded-(--radius)" />
            </div>
          </div>
          <SidePanel className="lg:min-h-0 lg:max-h-full">
            <div className="bg-card border border-line rounded-(--radius) shadow-card p-[18px] space-y-3 lg:max-h-full lg:overflow-y-auto">
              <div className="h-[72px] bg-line2 rounded-[11px]" />
              <div className="h-[64px] bg-line2 rounded-[11px]" />
              <div className="h-[88px] bg-line2 rounded-[11px]" />
              <div className="h-11 bg-line2 rounded-[8px]" />
            </div>
          </SidePanel>
        </SplitLayout>
      </div>
    </PageBody>
  );
}
