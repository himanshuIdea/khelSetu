import type { StateNavItem } from "@/components/state/StateSidebar";

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
  { title: string; subtitle: string; actionLabel?: string }
> = {
  overview: {
    title: "State overview",
    subtitle: "Aggregated across every academy and sports nursery · updated just now",
    actionLabel: "Export report",
  },
  nurseries: {
    title: "Sports nurseries",
    subtitle: "1,842 registered nurseries across 22 districts",
    actionLabel: "Add nursery",
  },
  athletes: {
    title: "Athletes",
    subtitle: "1.24 lakh athletes tracked statewide",
    actionLabel: "Export roster",
  },
  scouting: {
    title: "Talent scouting",
    subtitle: "KhelSetu auto-shortlists Haryana's next national athletes from live performance data",
    actionLabel: "Run shortlist",
  },
  verification: {
    title: "Verification",
    subtitle: "1,768 verified · 52 pending · 22 flagged",
    actionLabel: "Review flagged",
  },
  funds: {
    title: "Schemes & fund disbursement",
    subtitle: "Every rupee to athletes and coaches, paid by Direct Benefit Transfer — and tracked end-to-end",
    actionLabel: "Release funds",
  },
  districts: {
    title: "Districts",
    subtitle: "Performance and coverage across all 22 districts",
    actionLabel: "District report",
  },
  reports: {
    title: "Reports",
    subtitle: "State-wide analytics and compliance exports",
    actionLabel: "Generate report",
  },
};

export function getActiveStateNavItem(pathname: string): StateNavItem {
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
