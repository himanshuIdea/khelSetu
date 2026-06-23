export type PlayerNavItem = "home" | "explore" | "submit" | "drills" | "profile";

export const PLAYER_ROUTE_PREFIX = "/player";

export const playerRoutes: Record<PlayerNavItem, string> = {
  home: `${PLAYER_ROUTE_PREFIX}/home`,
  explore: `${PLAYER_ROUTE_PREFIX}/explore`,
  submit: `${PLAYER_ROUTE_PREFIX}/submit`,
  drills: `${PLAYER_ROUTE_PREFIX}/drills`,
  profile: `${PLAYER_ROUTE_PREFIX}/profile`,
};

export const playerAiFormRoute = `${PLAYER_ROUTE_PREFIX}/ai-form`;

export function playerDrillDetailRoute(postId: string): string {
  return `${playerRoutes.drills}/${postId}`;
}

export function playerAthleteProfileRoute(playerId: string): string {
  return `${playerRoutes.explore}/athletes/${playerId}`;
}

/** Bottom nav height in px — keep in sync with `PlayerTabBar` (`h-[72px]`). */
export const PLAYER_TAB_BAR_HEIGHT_PX = 72;

export const playerTabBarPaddingClass =
  "pb-[calc(var(--player-tab-bar-height,72px)+env(safe-area-inset-bottom,0px))]";

/** Scroll-end clearance for feed pages — clears fixed tab bar when content is scrolled to the end. */
export const playerFeedScrollEndClass =
  "pb-[calc(var(--player-tab-bar-height,72px)+env(safe-area-inset-bottom,0px)+16px)]";

/** @deprecated Tab bar is always visible on `/player/*`. Kept for legacy `PhoneShell`. */
export const PLAYER_ROUTES_WITHOUT_TAB_BAR = [
  playerRoutes.submit,
  playerRoutes.drills,
  playerAiFormRoute,
] as const;

export function getActivePlayerNavItem(pathname: string): PlayerNavItem {
  const segment = pathname.split("/").pop() ?? "home";
  const valid: PlayerNavItem[] = ["home", "explore", "submit", "drills", "profile"];
  return valid.includes(segment as PlayerNavItem) ? (segment as PlayerNavItem) : "home";
}

export function playerRouteShowsTabBar(pathname: string): boolean {
  return !PLAYER_ROUTES_WITHOUT_TAB_BAR.some((route) => pathname.startsWith(route));
}
