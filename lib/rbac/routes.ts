import { PLATFORM_ROLES, type PlatformRole } from "@/lib/rbac/roles";

export const STATE_ROUTE_PREFIX = "/state";

/** State dashboard segments guarded by platform RBAC. */
export const STATE_ROUTE_SEGMENTS = [
  "overview",
  "nurseries",
  "athletes",
  "scouting",
  "verification",
  "funds",
  "districts",
  "reports",
] as const;

export type StateRouteSegment = (typeof STATE_ROUTE_SEGMENTS)[number];

type RouteAccessRule = {
  prefix: string;
  roles: PlatformRole[];
};

/** Platform-level route access — extend here as new state roles are added. */
export const PLATFORM_ROUTE_ACCESS: RouteAccessRule[] = [
  {
    prefix: STATE_ROUTE_PREFIX,
    roles: [PLATFORM_ROLES.STATE_ADMIN],
  },
];

export function isStateRoute(pathname: string): boolean {
  return (
    pathname === STATE_ROUTE_PREFIX ||
    pathname.startsWith(`${STATE_ROUTE_PREFIX}/`)
  );
}

export function getRequiredPlatformRoles(pathname: string): PlatformRole[] | null {
  const rule = PLATFORM_ROUTE_ACCESS.find(
    (entry) =>
      pathname === entry.prefix || pathname.startsWith(`${entry.prefix}/`)
  );
  return rule?.roles ?? null;
}
