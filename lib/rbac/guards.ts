import type { PlatformRole } from "@/lib/rbac/roles";
import {
  getRequiredPlatformRoles,
  isStateRoute,
  STATE_ROUTE_PREFIX,
} from "@/lib/rbac/routes";

export function hasPlatformRole(
  userRole: PlatformRole | null | undefined,
  allowedRoles: PlatformRole[]
): boolean {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
}

export function canAccessRoute(
  pathname: string,
  platformRole: PlatformRole | null | undefined
): boolean {
  const requiredRoles = getRequiredPlatformRoles(pathname);
  if (!requiredRoles) return true;
  return hasPlatformRole(platformRole, requiredRoles);
}

export function canAccessStateRoutes(
  platformRole: PlatformRole | null | undefined
): boolean {
  return canAccessRoute(STATE_ROUTE_PREFIX, platformRole);
}

export function isStateAdmin(platformRole: PlatformRole | null | undefined): boolean {
  return canAccessStateRoutes(platformRole);
}

export function assertStateRouteAccess(
  pathname: string,
  platformRole: PlatformRole | null | undefined
): void {
  if (!canAccessRoute(pathname, platformRole)) {
    throw new StateRouteAccessError();
  }
}

export class StateRouteAccessError extends Error {
  constructor(message = "You do not have access to state routes.") {
    super(message);
    this.name = "StateRouteAccessError";
  }
}

export { isStateRoute };
