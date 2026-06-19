export type StateFundSchemeBeneficiaryType = "athlete" | "coach" | "nursery";

export type StateFundDisbursementStatus = "pending" | "paid";

export type StateFundSchemeDefinition = {
  slug: string;
  name: string;
  subtitle: string;
  beneficiaryType: StateFundSchemeBeneficiaryType;
  color: string;
  sortOrder: number;
  /** Initial allocation in paise when a scheme row is first created — zero until state admin sets it. */
  defaultAllocatedPaise: number;
};

export const FY_2026_27_LABEL = "2026-27";

/** FY total allocation default — zero until state admin sets it. */
export const DEFAULT_FY_TOTAL_ALLOCATED_PAISE = 0;

/** Canonical scheme catalog for the active fiscal year. */
export const STATE_FUND_SCHEME_DEFINITIONS: StateFundSchemeDefinition[] = [
  {
    slug: "padak-lao",
    name: "Padak Lao, Pad Pao (medal cash)",
    subtitle: "Olympic & national medallists",
    beneficiaryType: "athlete",
    color: "#12B886",
    sortOrder: 1,
    defaultAllocatedPaise: 0,
  },
  {
    slug: "sports-scholarships",
    name: "Sports scholarships",
    subtitle: "Nursery & academy athletes",
    beneficiaryType: "athlete",
    color: "#12B886",
    sortOrder: 2,
    defaultAllocatedPaise: 0,
  },
  {
    slug: "diet-allowance",
    name: "Diet allowance",
    subtitle: "Residential trainees",
    beneficiaryType: "athlete",
    color: "#2F6BFF",
    sortOrder: 3,
    defaultAllocatedPaise: 0,
  },
  {
    slug: "coach-honorarium",
    name: "Coach honorarium",
    subtitle: "NIS coaches statewide",
    beneficiaryType: "coach",
    color: "#12B886",
    sortOrder: 4,
    defaultAllocatedPaise: 0,
  },
  {
    slug: "nursery-equipment",
    name: "Nursery equipment grant",
    subtitle: "Registered sports nurseries",
    beneficiaryType: "nursery",
    color: "#F5A623",
    sortOrder: 5,
    defaultAllocatedPaise: 0,
  },
  {
    slug: "athlete-insurance",
    name: "Athlete insurance premium",
    subtitle: "All registered athletes",
    beneficiaryType: "athlete",
    color: "#F5A623",
    sortOrder: 6,
    defaultAllocatedPaise: 0,
  },
];

/**
 * Previously seeded mock/demo scheme allocations — zeroed on catalog ensure.
 * User-edited values that differ from these are preserved.
 */
export const LEGACY_SEEDED_SCHEME_ALLOCATIONS: Record<string, readonly number[]> = {
  "padak-lao": [1_613_636_364, 14_200_000_000],
  "sports-scholarships": [1_195_121_951, 9_800_000_000],
  "diet-allowance": [802_631_579, 6_100_000_000],
  "coach-honorarium": [593_406_593, 5_400_000_000],
  "nursery-equipment": [375_000_000, 2_400_000_000],
  "athlete-insurance": [145_833_333, 700_000_000],
};

/** FY total from mockup seed / migration 0022 — zeroed on catalog ensure. */
export const LEGACY_FY_TOTAL_ALLOCATED_PAISE = 47_100_000_000;

export function isLegacySeededSchemeAllocation(slug: string, allocatedAmountPaise: number): boolean {
  const legacyValues = LEGACY_SEEDED_SCHEME_ALLOCATIONS[slug];
  return legacyValues?.includes(allocatedAmountPaise) ?? false;
}

export function isStateFundSchemeSlug(value: string): value is string {
  return STATE_FUND_SCHEME_DEFINITIONS.some((s) => s.slug === value);
}

export function getSchemeDefinitionBySlug(slug: string) {
  return STATE_FUND_SCHEME_DEFINITIONS.find((s) => s.slug === slug);
}
