export type CoachNavItem = "home" | "players" | "attendance" | "teams" | "media";

export const COACH_ROUTE_PREFIX = "/coach";

export const coachRoutes = {
  home: `${COACH_ROUTE_PREFIX}/home`,
  players: `${COACH_ROUTE_PREFIX}/players`,
  attendance: `${COACH_ROUTE_PREFIX}/attendance`,
  teams: `${COACH_ROUTE_PREFIX}/teams`,
  media: `${COACH_ROUTE_PREFIX}/media`,
  post: `${COACH_ROUTE_PREFIX}/post`,
} as const;

export const COACH_ROUTES_WITHOUT_TAB_BAR = [
  coachRoutes.post,
] as const;

export function getActiveCoachNavItem(pathname: string): CoachNavItem {
  if (pathname.startsWith(`${coachRoutes.media}`)) {
    return "media";
  }

  const segment = pathname.split("/").pop() ?? "home";
  const valid: CoachNavItem[] = ["home", "players", "attendance", "teams", "media"];
  return valid.includes(segment as CoachNavItem) ? (segment as CoachNavItem) : "home";
}

export function coachRouteShowsTabBar(pathname: string): boolean {
  if (!pathname.startsWith(COACH_ROUTE_PREFIX)) {
    return false;
  }
  return !COACH_ROUTES_WITHOUT_TAB_BAR.some((route) => pathname.startsWith(route));
}

/** Bottom nav height in px — keep in sync with `CoachTabBar` (`h-[72px]`). */
export const COACH_TAB_BAR_HEIGHT_PX = 72;

export const coachTabBarPaddingClass =
  "pb-[calc(var(--coach-tab-bar-height,72px)+env(safe-area-inset-bottom,0px))]";

/** Mobile coach shell header offset (avatar row + padding + safe area). */
export const coachMobileHeaderPaddingClass =
  "pt-[calc(48px+max(12px,env(safe-area-inset-top,0px)))]";
