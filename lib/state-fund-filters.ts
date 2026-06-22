import type { StateFundSchemeBeneficiaryType } from "@/lib/state-fund-schemes";

export type GrantStatusFilter = "all" | "none" | "pending" | "paid";

export const GRANT_STATUS_FILTER_OPTIONS: { value: GrantStatusFilter; label: string }[] = [
  { value: "all", label: "Grant: All" },
  { value: "none", label: "Grant: Not granted" },
  { value: "pending", label: "Grant: Pending" },
  { value: "paid", label: "Grant: Paid" },
];

export const COACH_NIS_FILTER_OPTIONS = [
  { value: "all", label: "NIS: All" },
  { value: "NIS Level 1", label: "NIS: Level 1" },
  { value: "NIS Level 2", label: "NIS: Level 2" },
  { value: "In review", label: "NIS: In review" },
] as const;

export function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

export function matchesDistrictFilter(district: string, filter: string): boolean {
  return filter === "all" || district === filter;
}

export function matchesGrantFilter(
  status: "none" | "pending" | "paid",
  filter: GrantStatusFilter
): boolean {
  if (filter === "all") return true;
  return status === filter;
}

export function matchesSportFilter(
  beneficiaryType: StateFundSchemeBeneficiaryType,
  sportField: string,
  sportFilter: string
): boolean {
  if (sportFilter === "all") return true;
  if (beneficiaryType === "athlete") {
    return sportField.startsWith(sportFilter);
  }
  return sportField === sportFilter;
}
