import type { PillVariant } from "@/components/academy/shared";

export const SCOUTING_STATUS_VALUES = [
  "khelo_india",
  "shortlisted_for_nationals",
  "shortlisted_for_states",
  "in_trials",
  "not_selected",
  "watchlist",
] as const;

export type ScoutingStatus = (typeof SCOUTING_STATUS_VALUES)[number];

export const SCOUTING_STATUS_OPTIONS: { value: ScoutingStatus; label: string }[] = [
  { value: "khelo_india", label: "Khelo India" },
  { value: "shortlisted_for_nationals", label: "Shortlisted for nationals" },
  { value: "shortlisted_for_states", label: "Shortlisted for states" },
  { value: "in_trials", label: "In trials" },
  { value: "not_selected", label: "Not selected" },
  { value: "watchlist", label: "Watchlist" },
];

export const SHORTLIST_REPORT_STATUSES: ScoutingStatus[] = [
  "khelo_india",
  "shortlisted_for_nationals",
  "shortlisted_for_states",
];

const STATUS_LABELS: Record<ScoutingStatus, string> = Object.fromEntries(
  SCOUTING_STATUS_OPTIONS.map((o) => [o.value, o.label])
) as Record<ScoutingStatus, string>;

const STATUS_PILL_VARIANT: Record<ScoutingStatus, PillVariant> = {
  khelo_india: "green",
  shortlisted_for_nationals: "green",
  shortlisted_for_states: "blue",
  in_trials: "amber",
  not_selected: "grey",
  watchlist: "grey",
};

export function isScoutingStatus(value: string): value is ScoutingStatus {
  return (SCOUTING_STATUS_VALUES as readonly string[]).includes(value);
}

export function scoutingStatusLabel(status: ScoutingStatus | null | undefined): string {
  if (!status) return "—";
  return STATUS_LABELS[status] ?? status;
}

export function scoutingStatusPillVariant(status: ScoutingStatus): PillVariant {
  return STATUS_PILL_VARIANT[status] ?? "grey";
}

export const SCOUTING_STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Status: All" },
  { value: "unmarked", label: "Status: Unmarked" },
  ...SCOUTING_STATUS_OPTIONS.map((o) => ({ value: o.value, label: `Status: ${o.label}` })),
];

export const SCOUTING_STATUS_SELECT_OPTIONS = [
  { value: "", label: "—" },
  ...SCOUTING_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
];
