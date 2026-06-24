import { notFound, redirect } from "next/navigation";
import { PlayerProfileContent } from "@/components/player/PlayerProfileContent";
import { requirePlayerAccess } from "@/lib/auth/require-player-access";
import { playerRoutes } from "@/lib/player-nav";
import { getPlayerPortalProfile } from "@/lib/repositories/players";

type PlayerAthleteProfilePageProps = {
  params: Promise<{ playerId: string }>;
};

export default async function PlayerAthleteProfilePage({ params }: PlayerAthleteProfilePageProps) {
  const { playerId: targetPlayerId } = await params;
  const { playerId, academyId } = await requirePlayerAccess();

  if (targetPlayerId === playerId) {
    redirect(playerRoutes.profile);
  }

  const profile = await getPlayerPortalProfile(academyId, targetPlayerId);
  if (!profile) {
    notFound();
  }

  return <PlayerProfileContent profile={profile} variant="peer" />;
}
