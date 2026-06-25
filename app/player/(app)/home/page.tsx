import { PlayerFeed } from "@/components/player/PlayerFeed";
import { PlayerNotificationBell } from "@/components/player/PlayerNotifications";
import { PlayerPageHeader } from "@/components/player/PlayerPageHeader";
import { PlayerScreen } from "@/components/player/PlayerScreen";
import { requirePlayerAccess } from "@/lib/auth/require-player-access";
import { listAcademyFeed, listFeedSports } from "@/lib/repositories/academy-feed";
import { listPlayerNotifications } from "@/lib/repositories/player-notifications";

type PageProps = {
  searchParams: Promise<{ post?: string }>;
};

export default async function PlayerHomePage({ searchParams }: PageProps) {
  const { profile, academyId, playerId } = await requirePlayerAccess();
  const params = await searchParams;
  const highlightPostKey = params.post?.trim() || null;

  const [items, sports, notifications] = await Promise.all([
    listAcademyFeed(academyId, { viewerUserId: profile.id }),
    listFeedSports(academyId),
    listPlayerNotifications(academyId, playerId),
  ]);

  return (
    <PlayerScreen>
      <PlayerPageHeader
        brand
        trailing={
          <PlayerNotificationBell
            academyId={academyId}
            playerId={playerId}
            initialItems={notifications}
          />
        }
      />

      <PlayerFeed
        academyId={academyId}
        items={items}
        sports={sports}
        highlightPostKey={highlightPostKey}
      />
    </PlayerScreen>
  );
}
