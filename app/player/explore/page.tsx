import { PlayerExploreFeed } from "@/components/player/PlayerExploreFeed";
import { PlayerPageHeader } from "@/components/player/PlayerPageHeader";
import { PlayerScreen } from "@/components/player/PlayerScreen";
import { requirePlayerAccess } from "@/lib/auth/require-player-access";
import {
  listAcademyAthletes,
  listAcademyFeed,
  listFeedSports,
  listFeedTopics,
} from "@/lib/repositories/academy-feed";

export default async function PlayerExplorePage() {
  const { profile, academyId, playerId } = await requirePlayerAccess();

  const [items, sports, topics, athletes] = await Promise.all([
    listAcademyFeed(academyId, { viewerUserId: profile.id }),
    listFeedSports(academyId),
    listFeedTopics(academyId),
    listAcademyAthletes(academyId, { excludePlayerId: playerId }),
  ]);

  return (
    <PlayerScreen>
      <PlayerPageHeader title="Explore" />

      <PlayerExploreFeed
        academyId={academyId}
        items={items}
        sports={sports}
        topics={topics}
        athletes={athletes}
      />
    </PlayerScreen>
  );
}
