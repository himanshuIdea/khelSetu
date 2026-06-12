export type MobileNavItem = "home" | "explore" | "submit" | "drills" | "profile";

export const mobileRoutes: Record<MobileNavItem, string> = {
  home: "/mobile/home",
  explore: "/mobile/explore",
  submit: "/mobile/submit",
  drills: "/mobile/drills",
  profile: "/mobile/profile",
};

export function getActiveMobileNavItem(pathname: string): MobileNavItem {
  const segment = pathname.split("/").pop() ?? "home";
  const valid: MobileNavItem[] = ["home", "explore", "submit", "drills", "profile"];
  return valid.includes(segment as MobileNavItem)
    ? (segment as MobileNavItem)
    : "home";
}
