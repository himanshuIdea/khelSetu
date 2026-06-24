import { PlayerScreen } from "@/components/player/PlayerScreen";

export default function PlayerHomeLoading() {
  return (
    <PlayerScreen>
      <div className="px-4 pt-4 pb-3 animate-pulse">
        <div className="h-8 w-28 bg-line rounded-lg mb-4" />
        <div className="flex gap-2 overflow-hidden mb-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-9 w-20 bg-line rounded-full shrink-0" />
          ))}
        </div>
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="border border-line rounded-[18px] mb-3 overflow-hidden">
            <div className="h-12 bg-surface" />
            <div className="h-[208px] bg-line" />
            <div className="h-16 bg-surface" />
          </div>
        ))}
      </div>
    </PlayerScreen>
  );
}
