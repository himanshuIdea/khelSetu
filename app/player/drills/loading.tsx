import { playerLayout } from "@/lib/player-layout";

export default function PlayerDrillsLoading() {
  return (
    <div className="flex flex-1 flex-col min-h-0 min-w-0 w-full animate-pulse" aria-busy aria-label="Loading drills">
      <div className={`${playerLayout.pageX} pt-3 pb-4 shrink-0`}>
        <div className="h-7 w-24 max-w-[50%] bg-line rounded-lg" />
      </div>
      <div className={`${playerLayout.scrollBody} flex flex-col gap-3 min-w-0`}>
        <div className="flex gap-2 min-w-0">
          <div className="h-10 w-24 bg-line rounded-full shrink-0" />
          <div className="h-10 w-28 bg-line rounded-full shrink-0" />
        </div>
        {[0, 1, 2].map((index) => (
          <div key={index} className="h-[62px] bg-line rounded-[14px] min-w-0" />
        ))}
      </div>
    </div>
  );
}
