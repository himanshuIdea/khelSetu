import { playerLayout } from "@/lib/player-layout";

export default function PlayerLoading() {
  return (
    <div className="flex flex-1 flex-col min-h-0 min-w-0 w-full animate-pulse" aria-busy aria-label="Loading">
      <div className={`${playerLayout.pageX} pt-3 pb-4 shrink-0`}>
        <div className="h-7 w-36 max-w-[50%] bg-line rounded-lg" />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-4 sm:px-[18px] pb-8 min-w-0">
        <div className="w-full max-w-sm h-36 sm:h-40 bg-line rounded-(--radius) shrink-0" />
      </div>
    </div>
  );
}
