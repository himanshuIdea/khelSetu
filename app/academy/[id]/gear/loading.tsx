import { PageBody } from "@/components/academy/shared";

export default function GearPageLoading() {
  return (
    <PageBody>
      <div className="animate-pulse min-w-0 w-full" aria-busy aria-label="Loading gear inventory">
        <div className="flex flex-col lg:flex-row gap-3 lg:gap-[5px]">
          <div className="flex-1 min-w-0 space-y-4">
            <div className="space-y-2">
              <div className="h-7 w-56 bg-line rounded-lg" />
              <div className="h-4 w-80 max-w-full bg-line rounded" />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-24 bg-line rounded-(--radius)" />
              ))}
            </div>

            <div className="hidden lg:block border border-line rounded-(--radius) overflow-hidden">
              <div className="h-10 bg-line/60 border-b border-line" />
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 px-4 py-3 border-b border-line2 last:border-b-0"
                >
                  <div className="w-9 h-9 rounded-[9px] bg-line shrink-0" />
                  <div className="flex-1 h-3.5 bg-line rounded max-w-[180px]" />
                  <div className="h-6 w-16 bg-line rounded-full shrink-0" />
                </div>
              ))}
            </div>

            <div className="lg:hidden border border-line rounded-(--radius) overflow-hidden divide-y divide-line2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3 px-3.5 py-3.5">
                  <div className="w-9 h-9 rounded-[9px] bg-line shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-32 bg-line rounded" />
                    <div className="h-3 w-20 bg-line rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full lg:w-[316px] shrink-0 space-y-3.5">
            <div className="h-72 bg-line rounded-(--radius)" />
            <div className="h-48 bg-line rounded-(--radius)" />
            <div className="h-40 bg-line rounded-(--radius)" />
          </div>
        </div>
      </div>
    </PageBody>
  );
}
