import type { AuthAcademy, AuthProfile } from "@/lib/auth/types";
import {
  isPlayerMembershipRole,
  isStaffMembershipRole,
  MEMBERSHIP_ROLES,
} from "@/lib/rbac/membership-roles";
import { isStateAdmin } from "@/lib/rbac";

export function hasPlayerMembership(profile: AuthProfile): boolean {
  return profile.academies.some((academy) => isPlayerMembershipRole(academy.role));
}

export function hasStaffMembership(profile: AuthProfile): boolean {
  return profile.academies.some((academy) => isStaffMembershipRole(academy.role));
}

export function isPlayerOnlyMember(profile: AuthProfile): boolean {
  return profile.academies.length > 0 && profile.academies.every((academy) => academy.role === MEMBERSHIP_ROLES.PLAYER);
}

export function isCoachOnlyMember(profile: AuthProfile): boolean {
  return profile.academies.length > 0 && profile.academies.every((academy) => academy.role === MEMBERSHIP_ROLES.COACH);
}

export function hasCoachMembership(profile: AuthProfile): boolean {
  return profile.academies.some((academy) => academy.role === MEMBERSHIP_ROLES.COACH);
}

export function canAccessCoachPortal(profile: AuthProfile): boolean {
  if (isStateAdmin(profile.platformRole)) return false;
  return hasCoachMembership(profile) || hasStaffMembership(profile);
}

export function getPrimaryPlayerAcademy(profile: AuthProfile): AuthAcademy | undefined {
  return profile.academies.find((academy) => isPlayerMembershipRole(academy.role));
}

export function getPrimaryCoachAcademy(profile: AuthProfile): AuthAcademy | undefined {
  return (
    profile.academies.find((academy) => academy.role === MEMBERSHIP_ROLES.COACH) ??
    profile.academies.find((academy) => isStaffMembershipRole(academy.role))
  );
}

export function canAccessPlayerPortal(profile: AuthProfile): boolean {
  if (isStateAdmin(profile.platformRole)) return false;
  return hasPlayerMembership(profile);
}

export function canAccessAcademyAdmin(profile: AuthProfile): boolean {
  if (isStateAdmin(profile.platformRole)) return false;
  return hasStaffMembership(profile);
}
