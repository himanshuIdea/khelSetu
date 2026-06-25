import { PlayerBackButton } from "@/components/player/PlayerChrome";
import { PlayerNotificationsList } from "@/components/player/PlayerNotifications";
import { PlayerPageHeader } from "@/components/player/PlayerPageHeader";
import { PlayerScreen } from "@/components/player/PlayerScreen";
import { requirePlayerAccess } from "@/lib/auth/require-player-access";
import { playerRoutes } from "@/lib/player-nav";
import { listPlayerNotifications } from "@/lib/repositories/player-notifications";

export default async function PlayerNotificationsPage() {
  const { playerId, academyId } = await requirePlayerAccess();
  const items = await listPlayerNotifications(academyId, playerId);

  return (
    <PlayerScreen>
      <PlayerPageHeader
        leading={<PlayerBackButton href={playerRoutes.home} label="Back to home" />}
        title="Notifications"
      />
      <PlayerNotificationsList items={items} playerId={playerId} />
    </PlayerScreen>
  );
}
