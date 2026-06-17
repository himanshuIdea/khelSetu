import { PageBody, SplitLayout, SidePanel } from "@/components/academy/shared";
import { PageHeaderSkeleton, SidePanelSkeleton } from "@/components/academy/skeletons";

export default function CoachesPageLoading() {
  return (
    <PageBody>
      <SplitLayout>
        <div className="flex-1 min-w-0 animate-pulse" aria-busy aria-label="Loading coaches">
          <PageHeaderSkeleton action />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-[148px] bg-line rounded-(--radius) border border-line" />
            ))}
          </div>
        </div>
        <SidePanel>
          <SidePanelSkeleton rows={4} />
        </SidePanel>
      </SplitLayout>
    </PageBody>
  );
}
