import { PageBody } from "@/components/academy/shared";

export default function AttendancePageLoading() {
  return (
    <PageBody>
      <div className="animate-pulse min-w-0 w-full" aria-busy aria-label="Loading attendance">
        <div className="space-y-2 mb-4">
          <div className="h-7 w-36 bg-line2 rounded-lg" />
          <div className="h-4 w-80 max-w-full bg-line2 rounded" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 bg-line2 rounded-(--radius)" />
          ))}
        </div>

        <div className="bg-card border border-line rounded-(--radius) p-4 sm:p-5 mb-4 space-y-3">
          <div className="h-5 w-40 bg-line2 rounded" />
          <div className="h-4 w-64 max-w-full bg-line2 rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-11 bg-line2 rounded-[10px]" />
            ))}
          </div>
        </div>

        <div className="lg:hidden border border-line rounded-(--radius) overflow-hidden divide-y divide-line2 mb-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 px-3.5 py-3.5">
              <div className="w-9 h-9 rounded-[9px] bg-line2 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-32 bg-line2 rounded" />
                <div className="h-8 w-40 bg-line2 rounded-full" />
              </div>
            </div>
          ))}
        </div>

        <div className="hidden lg:block border border-line rounded-(--radius) overflow-hidden">
          <div className="h-10 bg-line2/60 border-b border-line" />
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 px-4 py-3 border-b border-line2 last:border-b-0">
              <div className="w-9 h-9 rounded-[9px] bg-line2 shrink-0" />
              <div className="flex-1 h-3.5 bg-line2 rounded max-w-[200px]" />
              <div className="h-8 w-36 bg-line2 rounded-full shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </PageBody>
  );
}
