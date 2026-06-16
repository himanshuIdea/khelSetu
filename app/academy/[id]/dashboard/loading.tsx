import { PageBody } from "@/components/academy/shared";

export default function DashboardLoading() {
  return (
    <PageBody>
      <div className="animate-pulse space-y-4 min-w-0">
        <div className="h-8 w-48 bg-surface rounded-[8px]" />
        <div className="h-4 w-full max-w-lg bg-surface rounded-[6px]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-[108px] bg-surface rounded-(--radius) border border-line" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-4">
          <div className="h-[280px] bg-surface rounded-(--radius) border border-line" />
          <div className="h-[280px] bg-surface rounded-(--radius) border border-line" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-4">
          <div className="h-[220px] bg-surface rounded-(--radius) border border-line" />
          <div className="h-[220px] bg-surface rounded-(--radius) border border-line" />
        </div>
      </div>
    </PageBody>
  );
}
