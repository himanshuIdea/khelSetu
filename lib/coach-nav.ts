export type CoachNavItem = "home" | "players" | "attendance" | "teams";

export const COACH_ROUTE_PREFIX = "/coach";

export const coachRoutes: Record<CoachNavItem, string> = {
  home: `${COACH_ROUTE_PREFIX}/home`,
  players: `${COACH_ROUTE_PREFIX}/players`,
  attendance: `${COACH_ROUTE_PREFIX}/attendance`,
  teams: `${COACH_ROUTE_PREFIX}/teams`,
};

export function getActiveCoachNavItem(pathname: string): CoachNavItem {
  const segment = pathname.split("/").pop() ?? "home";
  const valid: CoachNavItem[] = ["home", "players", "attendance", "teams"];
  return valid.includes(segment as CoachNavItem) ? (segment as CoachNavItem) : "home";
}

export function coachRouteShowsTabBar(pathname: string): boolean {
  return pathname.startsWith(COACH_ROUTE_PREFIX);
}
