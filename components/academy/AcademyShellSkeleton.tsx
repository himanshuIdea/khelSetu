import { AcademyRouteContentSkeleton } from "@/components/academy/skeletons";
import { BoltIcon } from "@/components/academy/icons";

const pulse = "animate-pulse bg-white/10";

type AcademyShellSkeletonProps = {
  children?: React.ReactNode;
};

export function AcademyShellSkeleton({ children }: AcademyShellSkeletonProps) {
  return (
    <div className="min-h-screen bg-surface">
      <div className="flex min-h-screen w-full">
        <aside className="hidden lg:flex w-[236px] shrink-0 bg-ink text-white flex-col pl-4 pr-2 py-[22px]">
          <div className="flex items-center gap-2.5 px-1.5 pb-[22px]">
            <div className="w-[34px] h-[34px] rounded-[10px] bg-linear-to-br from-brand to-[#FF9152] flex items-center justify-center">
              <BoltIcon className="w-5 h-5 text-white" />
            </div>
            <div className="font-bold text-lg tracking-[-0.2px]">
              Khel<span className="text-brand">Setu</span>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <div className={`h-3 w-16 rounded mx-2 mb-3 ${pulse}`} />
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className={`h-9 rounded-[11px] mx-1 ${pulse}`} />
            ))}
            <div className={`h-3 w-20 rounded mx-2 mt-5 mb-3 ${pulse}`} />
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={`op-${index}`} className={`h-9 rounded-[11px] mx-1 ${pulse}`} />
            ))}
          </div>
          <div className={`mt-auto h-14 rounded-xl mx-1 ${pulse}`} />
        </aside>

        <div className="flex flex-1 flex-col min-w-0 w-full">
          <header className="shrink-0 bg-card border-b border-line">
            <div className="flex items-center gap-3 md:gap-[18px] px-4 md:px-[26px] min-h-[66px] py-3 justify-between">
              <div className="flex items-center gap-[11px] min-w-0">
                <div className={`w-9 h-9 rounded-[9px] shrink-0 ${pulse} bg-line2`} />
                <div className="min-w-0 hidden md:block space-y-1.5">
                  <div className={`h-3.5 w-40 rounded ${pulse} bg-line2`} />
                  <div className={`h-3 w-28 rounded ${pulse} bg-line2`} />
                </div>
              </div>
              <div className={`hidden lg:block h-10 flex-1 max-w-[420px] rounded-[11px] ${pulse} bg-line2`} />
              <div className="flex gap-3">
                <div className={`w-[38px] h-[38px] rounded-[10px] ${pulse} bg-line2`} />
                <div className={`w-[38px] h-[38px] rounded-[10px] ${pulse} bg-line2`} />
              </div>
            </div>
          </header>
          {children ?? <AcademyRouteContentSkeleton />}
        </div>
      </div>
    </div>
  );
}
