import { redirect } from "next/navigation";
import {
  canAccessPlayerPortal,
  getPrimaryPlayerAcademy,
} from "@/lib/auth/membership-access";
import { resolvePlayerPortalDenialRedirect } from "@/lib/auth/redirect";
import { getSessionUserId } from "@/lib/auth/server";
import { buildPortalLoginUrl } from "@/lib/auth/portal-login";
import { playerRoutes } from "@/lib/player-nav";
import { getAuthProfile } from "@/lib/repositories/auth";
import { resolvePlayerForUser } from "@/lib/repositories/players";

export type PlayerAccessContext = {
  profile: NonNullable<Awaited<ReturnType<typeof getAuthProfile>>>;
  playerId: string;
  academyId: string;
};

export async function requirePlayerAccess(): Promise<PlayerAccessContext> {
  const userId = await getSessionUserId();
  if (!userId) {
    redirect(buildPortalLoginUrl("player", playerRoutes.home));
  }

  const profile = await getAuthProfile(userId);
  if (!profile) {
    redirect("/auth/login");
  }

  if (profile.academies.length === 0) {
    redirect("/auth/onboarding");
  }

  if (!canAccessPlayerPortal(profile)) {
    redirect(resolvePlayerPortalDenialRedirect(profile));
  }

  const playerAcademy = getPrimaryPlayerAcademy(profile);
  if (!playerAcademy) {
    redirect(resolvePlayerPortalDenialRedirect(profile));
  }

  const player = await resolvePlayerForUser(playerAcademy.id, userId);
  if (!player) {
    redirect(resolvePlayerPortalDenialRedirect(profile));
  }

  return { profile, playerId: player.id, academyId: playerAcademy.id };
}
