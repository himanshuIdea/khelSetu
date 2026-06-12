import type { AcademyNavItem } from "@/components/academy/AcademySidebar";

export const searchPlaceholders: Partial<Record<AcademyNavItem, string>> = {
  dashboard: "Search players, coaches, teams…",
  players: "Search players…",
  coaches: "Search coaches…",
  teams: "Search teams…",
  tournaments: "Search tournaments…",
  attendance: "Search attendance…",
  gear: "Search gear & kit…",
  fees: "Search staff…",
  reports: "Search reports…",
};

export function getActiveNavItem(pathname: string): AcademyNavItem {
  const segment = pathname.split("/").pop() ?? "dashboard";
  const valid: AcademyNavItem[] = [
    "dashboard",
    "players",
    "coaches",
    "teams",
    "tournaments",
    "attendance",
    "gear",
    "fees",
    "reports",
  ];
  return valid.includes(segment as AcademyNavItem)
    ? (segment as AcademyNavItem)
    : "dashboard";
}
