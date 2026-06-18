import { VideoIcon } from "@/components/academy/icons";
import { PlayerDrillsWorkspace } from "@/components/player/PlayerDrills";
import { PlayerEmptyState } from "@/components/player/PlayerEmptyState";
import { PlayerPageHeader } from "@/components/player/PlayerPageHeader";
import { PlayerScrollBody } from "@/components/player/PlayerScrollBody";
import { PlayerScreen } from "@/components/player/PlayerScreen";
import { requirePlayerAccess } from "@/lib/auth/require-player-access";
import {
  getPlayerDrillListContext,
  listPlayerAssignedDrills,
} from "@/lib/repositories/player-drills";

export default async function PlayerDrillsPage() {
  const { playerId, academyId } = await requirePlayerAccess();

  const [context, drills] = await Promise.all([
    getPlayerDrillListContext(academyId, playerId),
    listPlayerAssignedDrills(academyId, playerId),
  ]);

  return (
    <PlayerScreen>
      <PlayerPageHeader title="Drills" />

      {!context.hasBatch ? (
        <PlayerEmptyState
          icon={<VideoIcon className="w-5 h-5" />}
          title="Not in a batch yet"
          description="Once you're assigned to a batch, drills from your coach and batch coaches will appear here."
        />
      ) : (
        <PlayerScrollBody>
          <PlayerDrillsWorkspace drills={drills} />
        </PlayerScrollBody>
      )}
    </PlayerScreen>
  );
}
