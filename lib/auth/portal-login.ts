export type PortalKind = "player" | "coach" | "staff" | "admin";

export const portalLoginRoutes: Record<PortalKind, string> = {
  player: "/auth/player/login",
  coach: "/auth/coach/login",
  staff: "/auth/staff/login",
  admin: "/auth/login",
};

const PORTAL_NEXT_PREFIXES: Record<PortalKind, string[]> = {
  player: ["/player/"],
  coach: ["/coach/"],
  staff: ["/academy/", "/staff/"],
  admin: ["/academy/", "/state/"],
};

export function loginRouteForPathname(pathname: string): string {
  if (pathname.startsWith("/player")) {
    return portalLoginRoutes.player;
  }
  if (pathname.startsWith("/coach")) {
    return portalLoginRoutes.coach;
  }
  if (pathname.startsWith("/staff")) {
    return portalLoginRoutes.staff;
  }
  return portalLoginRoutes.admin;
}

export function isSafePortalNext(next: string, portal: PortalKind): boolean {
  const trimmed = next.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return false;
  }
  if (trimmed.includes("://") || trimmed.includes("\\")) {
    return false;
  }
  const prefixes = PORTAL_NEXT_PREFIXES[portal];
  return prefixes.some((prefix) => trimmed === prefix.slice(0, -1) || trimmed.startsWith(prefix));
}

export function buildPortalLoginUrl(portal: PortalKind, next?: string): string {
  const base = portalLoginRoutes[portal];
  if (!next || !isSafePortalNext(next, portal)) {
    return base;
  }
  return `${base}?next=${encodeURIComponent(next)}`;
}

export function portalKindFromCredentialSegment(
  segment: "athletes" | "coaches" | "staff"
): Exclude<PortalKind, "admin"> {
  switch (segment) {
    case "athletes":
      return "player";
    case "coaches":
      return "coach";
    case "staff":
      return "staff";
  }
}

/** Absolute sign-in URL for credential handoff (client-safe when origin is known). */
export function portalLoginAbsoluteUrl(portal: Exclude<PortalKind, "admin">, origin: string): string {
  return `${origin.replace(/\/$/, "")}${portalLoginRoutes[portal]}`;
}
