import { BellIcon, SearchIcon } from "@/components/academy/icons";
import { PlayerFeed } from "@/components/player/PlayerFeed";
import { PlayerIconButton } from "@/components/player/PlayerChrome";
import { PlayerPageHeader } from "@/components/player/PlayerPageHeader";
import { PlayerScreen } from "@/components/player/PlayerScreen";
import { requirePlayerAccess } from "@/lib/auth/require-player-access";
import { listAcademyFeed, listFeedSports } from "@/lib/repositories/academy-feed";

type PageProps = {
  searchParams: Promise<{ post?: string }>;
};

export default async function PlayerHomePage({ searchParams }: PageProps) {
  const { profile, academyId } = await requirePlayerAccess();
  const params = await searchParams;
  const highlightPostKey = params.post?.trim() || null;

  const [items, sports] = await Promise.all([
    listAcademyFeed(academyId, { viewerUserId: profile.id }),
    listFeedSports(academyId),
  ]);

  return (
    <PlayerScreen>
      <PlayerPageHeader
        brand
        trailing={
          <>
            <PlayerIconButton ariaLabel="Search">
              <SearchIcon />
            </PlayerIconButton>
            <PlayerIconButton ariaLabel="Notifications">
              <BellIcon />
            </PlayerIconButton>
          </>
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
