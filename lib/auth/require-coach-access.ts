import { cache } from "react";
import { redirect } from "next/navigation";
import {
  canAccessCoachPortal,
  getPrimaryCoachAcademy,
  isPlayerOnlyMember,
} from "@/lib/auth/membership-access";
import { buildPortalLoginUrl } from "@/lib/auth/portal-login";
import { resolveCoachPortalDenialRedirect } from "@/lib/auth/redirect";
import { getSessionUserId } from "@/lib/auth/server";
import { coachRoutes } from "@/lib/coach-nav";
import { playerRoutes } from "@/lib/player-nav";
import { getAuthProfile } from "@/lib/repositories/auth";
import { resolveCoachForUser } from "@/lib/repositories/coaches";

export type CoachAccessContext = {
  profile: NonNullable<Awaited<ReturnType<typeof getAuthProfile>>>;
  coachId: string;
  academyId: string;
};

export const requireCoachAccess = cache(async (): Promise<CoachAccessContext> => {
  const userId = await getSessionUserId();
  if (!userId) {
    redirect(buildPortalLoginUrl("coach", coachRoutes.home));
  }

  const profile = await getAuthProfile(userId);
  if (!profile) {
    redirect(buildPortalLoginUrl("coach", coachRoutes.home));
  }

  if (profile.academies.length === 0) {
    redirect("/auth/onboarding");
  }

  if (isPlayerOnlyMember(profile)) {
    redirect(playerRoutes.home);
  }

  if (!canAccessCoachPortal(profile)) {
    redirect(resolveCoachPortalDenialRedirect(profile));
  }

  const coachAcademy = getPrimaryCoachAcademy(profile);
  if (!coachAcademy) {
    redirect(resolveCoachPortalDenialRedirect(profile));
  }

  const coach = await resolveCoachForUser(coachAcademy.id, userId);
  if (!coach) {
    redirect(resolveCoachPortalDenialRedirect(profile));
  }

  return { profile, coachId: coach.id, academyId: coachAcademy.id };
});
