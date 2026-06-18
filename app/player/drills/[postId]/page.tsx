import { notFound } from "next/navigation";
import { PlayerBackButton } from "@/components/player/PlayerChrome";
import { PlayerDrillDetailContent } from "@/components/player/PlayerDrills";
import { PlayerPageHeader } from "@/components/player/PlayerPageHeader";
import { PlayerScrollBody } from "@/components/player/PlayerScrollBody";
import { PlayerScreen } from "@/components/player/PlayerScreen";
import { requirePlayerAccess } from "@/lib/auth/require-player-access";
import { playerRoutes } from "@/lib/player-nav";
import { getPlayerAssignedDrillPost } from "@/lib/repositories/player-drills";

type PlayerDrillDetailPageProps = {
  params: Promise<{ postId: string }>;
};

export default async function PlayerDrillDetailPage({ params }: PlayerDrillDetailPageProps) {
  const { postId } = await params;
  const { playerId, academyId } = await requirePlayerAccess();

  const drill = await getPlayerAssignedDrillPost(academyId, playerId, postId);
  if (!drill) {
    notFound();
  }

  return (
    <PlayerScreen>
      <PlayerPageHeader
        leading={<PlayerBackButton href={playerRoutes.drills} label="Back to drills" />}
        title={drill.drillName}
      />

      <PlayerScrollBody>
        <PlayerDrillDetailContent drill={drill} />
      </PlayerScrollBody>
    </PlayerScreen>
  );
}
