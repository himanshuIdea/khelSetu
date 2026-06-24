import { PlayerScreen } from "@/components/player/PlayerScreen";

export default function PlayerExploreLoading() {
  return (
    <PlayerScreen>
      <div className="px-4 pt-4 pb-3 animate-pulse min-w-0">
        <div className="h-8 w-24 bg-line rounded-lg mb-4" />
        <div className="h-11 bg-line rounded-[12px] mb-4" />
        <div className="flex gap-2 mb-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-9 w-20 bg-line rounded-full shrink-0" />
          ))}
        </div>
        <div className="flex gap-3 mb-5 overflow-hidden">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-28 w-[140px] bg-line rounded-[14px] shrink-0" />
          ))}
        </div>
        <div className="border border-line rounded-[18px] mb-3 overflow-hidden">
          <div className="h-12 bg-surface" />
          <div className="h-[208px] bg-line" />
        </div>
      </div>
    </PlayerScreen>
  );
}
