import { PageBody, SplitLayout, SidePanel } from "@/components/academy/shared";
import { PageHeaderSkeleton, SidePanelSkeleton } from "@/components/academy/skeletons";

export default function CoachPlayersLoading() {
  return (
    <PageBody className="lg:pr-0">
      <SplitLayout>
        <div className="flex-1 min-w-0 animate-pulse" aria-busy aria-label="Loading players">
          <PageHeaderSkeleton />
          <div className="flex gap-2 mb-4 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-9 w-24 bg-line rounded-full shrink-0" />
            ))}
          </div>
          <div className="space-y-2 lg:hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-[72px] bg-line rounded-(--radius) border border-line" />
            ))}
          </div>
          <div className="hidden lg:block h-[320px] bg-line rounded-(--radius) border border-line" />
        </div>
        <SidePanel className="hidden lg:block">
          <SidePanelSkeleton rows={5} />
        </SidePanel>
      </SplitLayout>
    </PageBody>
  );
}
