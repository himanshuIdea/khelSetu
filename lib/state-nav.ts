import type { StateNavItem } from "@/components/state/StateSidebar";
import type { StateSummary } from "@/lib/state-portal";

export const stateSearchPlaceholders: Partial<Record<StateNavItem, string>> = {
  overview: "Search nurseries, athletes, districts…",
  nurseries: "Search sports nurseries…",
  athletes: "Search athletes…",
  scouting: "Search athletes by name, sport, district…",
  verification: "Search nurseries, verification status…",
  funds: "Search schemes, beneficiaries, districts…",
  districts: "Search districts…",
  reports: "Search reports…",
};

export const statePageMeta: Record<
  StateNavItem,
  { title: string; actionLabel?: string }
> = {
  overview: {
    title: "State overview",
    actionLabel: "Export report",
  },
  nurseries: {
    title: "Sports nurseries",
    actionLabel: "Add nursery",
  },
  athletes: {
    title: "Athletes",
    actionLabel: "Export roster",
  },
  scouting: {
    title: "Talent scouting",
    actionLabel: "Run shortlist",
  },
  verification: {
    title: "Verification",
    actionLabel: "Review flagged",
  },
  funds: {
    title: "Schemes & fund disbursement",
    actionLabel: "Release funds",
  },
  districts: {
    title: "Districts",
    actionLabel: "District report",
  },
  reports: {
    title: "Reports",
    actionLabel: "Generate report",
  },
};

export function getActiveStateNavItem(pathname: string): StateNavItem {
  if (pathname.startsWith("/state/funds")) {
    return "funds";
  }

  const segment = pathname.split("/").pop() ?? "overview";
  const valid: StateNavItem[] = [
    "overview",
    "nurseries",
    "athletes",
    "scouting",
    "verification",
    "funds",
    "districts",
    "reports",
  ];
  return valid.includes(segment as StateNavItem)
    ? (segment as StateNavItem)
    : "overview";
}

/** Optional subtitle builder when summary is available server-side. */
export function buildStateSubtitle(item: StateNavItem, summary: StateSummary): string {
  switch (item) {
    case "overview":
      return `Aggregated across ${summary.nurseryCount} nurseries and ${summary.athleteCount.toLocaleString("en-IN")} athletes`;
    case "nurseries":
      return `${summary.nurseryCount} registered nurseries`;
    case "athletes":
      return `${summary.athleteCount.toLocaleString("en-IN")} athletes tracked statewide`;
    case "verification":
      return `${summary.verifiedCount} verified · ${summary.pendingCount} pending · ${summary.flaggedCount} flagged`;
    case "districts":
      return "Performance and coverage across all districts";
    default:
      return "";
  }
}
