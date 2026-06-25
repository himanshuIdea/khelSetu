import { PlayerScreen } from "@/components/player/PlayerScreen";
import { PlayerScrollBody } from "@/components/player/PlayerScrollBody";
import { playerLayout } from "@/lib/player-layout";

export default function PlayerNotificationsLoading() {
  return (
    <PlayerScreen>
      <div className="px-4 sm:px-[18px] pt-3 pb-3 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-line rounded-[11px] shrink-0" />
          <div className="h-5 w-32 bg-line rounded-md" />
        </div>
      </div>
      <PlayerScrollBody className="gap-2.5 pt-0">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className={`${playerLayout.card} flex items-start gap-3 p-3.5 animate-pulse`}>
            <div className="w-10 h-10 bg-line rounded-xl shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="h-4 w-3/4 bg-line rounded" />
              <div className="h-3 w-full bg-line rounded" />
              <div className="h-3 w-16 bg-line rounded" />
            </div>
          </div>
        ))}
      </PlayerScrollBody>
    </PlayerScreen>
  );
}
