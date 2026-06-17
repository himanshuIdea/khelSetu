import {
  canAccessAcademyAdmin,
  canAccessCoachPortal,
  canAccessPlayerPortal,
  getPrimaryCoachAcademy,
  getPrimaryPlayerAcademy,
  hasCoachMembership,
  hasPlayerMembership,
  isCoachOnlyMember,
  isPlayerOnlyMember,
} from "@/lib/auth/membership-access";
import type { PortalKind } from "@/lib/auth/portal-login";
import { buildPortalLoginUrl, isSafePortalNext } from "@/lib/auth/portal-login";
import type { AuthProfile } from "@/lib/auth/types";
import { coachRoutes } from "@/lib/coach-nav";
import { playerRoutes } from "@/lib/player-nav";
import { resolveCoachForUser } from "@/lib/repositories/coaches";
import { resolvePlayerForUser } from "@/lib/repositories/players";
import { isStateAdmin, STATE_ROUTE_PREFIX } from "@/lib/rbac";
import { MEMBERSHIP_ROLES } from "@/lib/rbac/membership-roles";

export function resolvePlayerPortalDenialRedirect(profile: AuthProfile): string {
  if (isStateAdmin(profile.platformRole)) {
    return STATE_ROUTE_PREFIX;
  }

  if (
    isCoachOnlyMember(profile) ||
    (hasCoachMembership(profile) && !hasPlayerMembership(profile))
  ) {
    return coachRoutes.home;
  }

  if (canAccessAcademyAdmin(profile)) {
    const staffAcademy =
      profile.academies.find((academy) => academy.role !== MEMBERSHIP_ROLES.PLAYER) ??
      profile.academies[0];
    return `/academy/${staffAcademy.id}/dashboard`;
  }

  if (hasPlayerMembership(profile)) {
    return playerRoutes.home;
  }

  if (profile.academies.length === 0) {
    return "/auth/onboarding";
  }

  return buildPortalLoginUrl("player", playerRoutes.home);
}

export function resolveCoachPortalDenialRedirect(profile: AuthProfile): string {
  if (isStateAdmin(profile.platformRole)) {
    return STATE_ROUTE_PREFIX;
  }

  if (isPlayerOnlyMember(profile) || (hasPlayerMembership(profile) && !hasCoachMembership(profile))) {
    return playerRoutes.home;
  }

  if (canAccessAcademyAdmin(profile) && !hasCoachMembership(profile)) {
    const staffAcademy =
      profile.academies.find((academy) => academy.role !== MEMBERSHIP_ROLES.PLAYER) ??
      profile.academies[0];
    return `/academy/${staffAcademy.id}/dashboard`;
  }

  if (profile.academies.length === 0) {
    return "/auth/onboarding";
  }

  return buildPortalLoginUrl("coach", coachRoutes.home);
}

function resolveAdminPostAuthRedirect(profile: AuthProfile): string {
  if (isStateAdmin(profile.platformRole)) {
    return STATE_ROUTE_PREFIX;
  }

  if (isCoachOnlyMember(profile)) {
    return coachRoutes.home;
  }

  if (hasPlayerMembership(profile) && !canAccessAcademyAdmin(profile)) {
    return playerRoutes.home;
  }

  if (canAccessAcademyAdmin(profile)) {
    const staffAcademy =
      profile.academies.find((academy) => academy.role !== MEMBERSHIP_ROLES.PLAYER) ??
      profile.academies[0];
    return `/academy/${staffAcademy.id}/dashboard`;
  }

  return "/auth/onboarding";
}

export async function resolvePostAuthRedirectForPortal(
  profile: AuthProfile,
  portal: PortalKind,
  next?: string | null
): Promise<string> {
  if (profile.mustChangePassword) {
    return "/auth/change-password";
  }

  const safeNext = next && isSafePortalNext(next, portal) ? next : null;

  if (portal === "admin") {
    if (safeNext && isSafePortalNext(safeNext, "admin")) {
      return safeNext;
    }
    return resolveAdminPostAuthRedirect(profile);
  }

  if (portal === "player") {
    if (!canAccessPlayerPortal(profile)) {
      return resolvePlayerPortalDenialRedirect(profile);
    }

    const playerAcademy = getPrimaryPlayerAcademy(profile);
    if (!playerAcademy) {
      return resolvePlayerPortalDenialRedirect(profile);
    }

    const player = await resolvePlayerForUser(playerAcademy.id, profile.id);
    if (!player) {
      return resolvePlayerPortalDenialRedirect(profile);
    }

    if (safeNext?.startsWith("/player")) {
      return safeNext;
    }

    return playerRoutes.home;
  }

  if (portal === "coach") {
    if (!canAccessCoachPortal(profile)) {
      return resolveCoachPortalDenialRedirect(profile);
    }

    const coachAcademy = getPrimaryCoachAcademy(profile);
    if (!coachAcademy) {
      return resolveCoachPortalDenialRedirect(profile);
    }

    const coach = await resolveCoachForUser(coachAcademy.id, profile.id);
    if (!coach) {
      return resolveCoachPortalDenialRedirect(profile);
    }

    if (safeNext?.startsWith("/coach")) {
      return safeNext;
    }

    return coachRoutes.home;
  }

  if (portal === "staff") {
    const hasStaffAccess =
      profile.academies.some((academy) => academy.role === MEMBERSHIP_ROLES.STAFF) ||
      canAccessAcademyAdmin(profile);

    if (!hasStaffAccess) {
      return resolvePlayerPortalDenialRedirect(profile);
    }

    const staffAcademy =
      profile.academies.find((academy) => academy.role === MEMBERSHIP_ROLES.STAFF) ??
      profile.academies.find((academy) => academy.role !== MEMBERSHIP_ROLES.PLAYER) ??
      profile.academies[0];
    const defaultDest = `/academy/${staffAcademy.id}/dashboard`;

    if (safeNext?.startsWith("/academy") || safeNext?.startsWith("/staff")) {
      return safeNext;
    }

    return defaultDest;
  }

  return resolveAdminPostAuthRedirect(profile);
}

export function resolvePostAuthRedirect(profile: AuthProfile): string {
  if (profile.mustChangePassword) {
    return "/auth/change-password";
  }

  return resolveAdminPostAuthRedirect(profile);
}
