import { notFound } from "next/navigation";
import { PlayerProfileContent } from "@/components/player/PlayerProfileContent";
import { requirePlayerAccess } from "@/lib/auth/require-player-access";
import { getPlayerPortalProfile } from "@/lib/repositories/players";

export default async function PlayerProfilePage() {
  const { playerId, academyId } = await requirePlayerAccess();
  const profile = await getPlayerPortalProfile(academyId, playerId);

  if (!profile) {
    notFound();
  }

  return <PlayerProfileContent profile={profile} />;
}
