/** Report catalog — stable IDs used by API, UI, and generators. */
export const STATE_REPORT_TYPES = [
  "district-performance",
  "fund-utilisation",
  "talent-pipeline",
  "verification-compliance",
  "full-state",
] as const;

export type StateReportType = (typeof STATE_REPORT_TYPES)[number];

export type StateReportCatalogEntry = {
  id: StateReportType;
  title: string;
  detail: string;
  tag: string;
  /** When true, render as a full-width featured card at the top. */
  featured?: boolean;
};

export const STATE_REPORT_CATALOG: StateReportCatalogEntry[] = [
  {
    id: "full-state",
    title: "Full state report",
    detail: "Districts, funds, talent pipeline, and verification in one export",
    tag: "Combined",
    featured: true,
  },
  {
    id: "district-performance",
    title: "District performance summary",
    detail: "Athletes, nurseries, verification by district",
    tag: "Monthly",
  },
  {
    id: "fund-utilisation",
    title: "Fund utilisation report",
    detail: "Scheme-wise DBT disbursement and pending approvals",
    tag: "FY 2026-27",
  },
  {
    id: "talent-pipeline",
    title: "Talent pipeline export",
    detail: "Khelo India shortlist and scouting scores",
    tag: "Quarterly",
  },
  {
    id: "verification-compliance",
    title: "Verification compliance",
    detail: "Flagged nurseries and audit trail",
    tag: "On demand",
  },
];

export const STATE_REPORT_CATALOG_BY_ID = Object.fromEntries(
  STATE_REPORT_CATALOG.map((entry) => [entry.id, entry])
) as Record<StateReportType, StateReportCatalogEntry>;

export function isStateReportType(value: string): value is StateReportType {
  return (STATE_REPORT_TYPES as readonly string[]).includes(value);
}
