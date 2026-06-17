export {
  PLATFORM_ROLES,
  PLATFORM_ROLE_LABELS,
  type PlatformRole,
} from "@/lib/rbac/roles";

export {
  STATE_ROUTE_PREFIX,
  STATE_ROUTE_SEGMENTS,
  PLATFORM_ROUTE_ACCESS,
  getRequiredPlatformRoles,
  isStateRoute,
  type StateRouteSegment,
} from "@/lib/rbac/routes";

export {
  MEMBERSHIP_ROLES,
  isPlayerMembershipRole,
  isStaffMembershipRole,
  type MembershipRole,
} from "@/lib/rbac/membership-roles";

export {
  hasPlatformRole,
  canAccessRoute,
  canAccessStateRoutes,
  isStateAdmin,
  assertStateRouteAccess,
  StateRouteAccessError,
} from "@/lib/rbac/guards";
