import { PageBody } from "@/components/academy/shared";

export default function NurseriesLoading() {
  return (
    <PageBody>
      <div className="mb-[18px] animate-pulse">
        <div className="h-7 w-48 bg-line rounded-md" />
        <div className="h-4 w-72 bg-line rounded-md mt-2" />
      </div>
      <div className="flex flex-wrap gap-2 mb-4 animate-pulse">
        <div className="h-9 w-28 bg-line rounded-full" />
        <div className="h-9 w-24 bg-line rounded-full" />
        <div className="h-9 w-32 bg-line rounded-full" />
      </div>
      <div className="bg-card border border-line rounded-(--radius) shadow-card overflow-hidden animate-pulse">
        <div className="h-11 bg-surface border-b border-line" />
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 px-4 py-3.5 border-b border-line2 last:border-b-0">
            <div className="w-9 h-9 rounded-[9px] bg-line shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-40 bg-line rounded" />
              <div className="h-3 w-28 bg-line rounded" />
            </div>
            <div className="h-6 w-16 bg-line rounded-full" />
          </div>
        ))}
      </div>
    </PageBody>
  );
}
