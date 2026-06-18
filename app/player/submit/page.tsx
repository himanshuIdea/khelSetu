import { PlayerSubmitForm } from "@/components/player/PlayerSubmitForm";
import { PlayerBackButton } from "@/components/player/PlayerChrome";
import { PlayerPageHeader } from "@/components/player/PlayerPageHeader";
import { PlayerScreen } from "@/components/player/PlayerScreen";
import { requirePlayerAccess } from "@/lib/auth/require-player-access";
import { getPlayerAssignedDrillPost } from "@/lib/repositories/player-drills";
import { playerRoutes } from "@/lib/player-nav";

type PageProps = {
  searchParams: Promise<{ drillPostId?: string }>;
};

export default async function PlayerSubmitPage({ searchParams }: PageProps) {
  const { academyId, playerId } = await requirePlayerAccess();
  const params = await searchParams;
  const drillPostId = params.drillPostId?.trim() || null;

  let initialDrillName = "";
  if (drillPostId) {
    const drill = await getPlayerAssignedDrillPost(academyId, playerId, drillPostId);
    if (drill) {
      initialDrillName = drill.drillName;
    }
  }

  return (
    <PlayerScreen>
      <PlayerPageHeader
        leading={<PlayerBackButton href={playerRoutes.home} label="Back to home" />}
        title="Submit drill video"
      />
      <PlayerSubmitForm
        academyId={academyId}
        initialDrillName={initialDrillName}
        initialDrillPostId={drillPostId}
      />
    </PlayerScreen>
  );
}
