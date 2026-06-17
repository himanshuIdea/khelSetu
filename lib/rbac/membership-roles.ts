export const MEMBERSHIP_ROLES = {
  ADMIN: "admin",
  COACH: "coach",
  STAFF: "staff",
  PLAYER: "player",
} as const;

export type MembershipRole = (typeof MEMBERSHIP_ROLES)[keyof typeof MEMBERSHIP_ROLES];

const STAFF_ROLES: MembershipRole[] = [
  MEMBERSHIP_ROLES.ADMIN,
  MEMBERSHIP_ROLES.COACH,
  MEMBERSHIP_ROLES.STAFF,
];

export function isStaffMembershipRole(role: string): role is MembershipRole {
  return STAFF_ROLES.includes(role as MembershipRole);
}

export function isPlayerMembershipRole(role: string): role is typeof MEMBERSHIP_ROLES.PLAYER {
  return role === MEMBERSHIP_ROLES.PLAYER;
}
