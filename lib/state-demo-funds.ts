import { formatCompactCount, formatStateFundAmount } from "@/lib/format";
import { FY_2026_27_LABEL, STATE_FUND_SCHEME_DEFINITIONS } from "@/lib/state-fund-schemes";
import type {
  FundUtilisationRow,
  StateFundsDashboard,
  StateFundScheme,
  StateFundUtilisationSummary,
} from "@/lib/state-portal";

// Totals: beneficiaries=1932, allocated=7 Cr, disbursed=3.89 Cr
// TODO(demo): remove when live fund rollup is ready for recordings

const CRORE_PAISE = 100_000_000;

type DemoFundSchemeSeed = {
  slug: string;
  beneficiaries: number;
  /** Allocation in paise (1 Cr = 100_000_000 paise). */
  allocatedPaise: number;
  disbursedPaise: number;
};

const DEMO_FUND_SCHEME_SEEDS: DemoFundSchemeSeed[] = [
  {
    slug: "sports-scholarships",
    beneficiaries: 720,
    allocatedPaise: 222 * CRORE_PAISE,
    disbursedPaise: 192 * CRORE_PAISE,
  },
  {
    slug: "padak-lao",
    beneficiaries: 45,
    allocatedPaise: 100 * CRORE_PAISE,
    disbursedPaise: 40 * CRORE_PAISE,
  },
  {
    slug: "diet-allowance",
    beneficiaries: 380,
    allocatedPaise: 140 * CRORE_PAISE,
    disbursedPaise: 110 * CRORE_PAISE,
  },
  {
    slug: "coach-honorarium",
    beneficiaries: 312,
    allocatedPaise: 25 * CRORE_PAISE,
    disbursedPaise: 14.8 * CRORE_PAISE,
  },
  {
    slug: "nursery-equipment",
    beneficiaries: 385,
    allocatedPaise: 90 * CRORE_PAISE,
    disbursedPaise: 49 * CRORE_PAISE,
  },
  {
    slug: "athlete-insurance",
    beneficiaries: 90,
    allocatedPaise: 0.4 * CRORE_PAISE,
    disbursedPaise: 0.25 * CRORE_PAISE,
  },
];

function utilPercent(disbursedPaise: number, allocatedPaise: number): number {
  if (allocatedPaise <= 0) return 0;
  return Math.round((disbursedPaise / allocatedPaise) * 100);
}

function toFundScheme(seed: DemoFundSchemeSeed): StateFundScheme {
  const def = STATE_FUND_SCHEME_DEFINITIONS.find((scheme) => scheme.slug === seed.slug);
  if (!def) {
    throw new Error(`Missing fund scheme definition for slug: ${seed.slug}`);
  }

  return {
    id: `demo-${seed.slug}`,
    slug: def.slug,
    name: def.name,
    detail: def.subtitle,
    beneficiaryType: def.beneficiaryType,
    beneficiaries: formatCompactCount(seed.beneficiaries),
    allocated: formatStateFundAmount(seed.allocatedPaise),
    allocatedPaise: seed.allocatedPaise,
    disbursed: formatStateFundAmount(seed.disbursedPaise),
    disbursedPaise: seed.disbursedPaise,
    util: utilPercent(seed.disbursedPaise, seed.allocatedPaise),
    color: def.color,
  };
}

function toUtilisationRow(scheme: StateFundScheme): FundUtilisationRow {
  return {
    label: scheme.name,
    value: `${scheme.util}%`,
    percent: scheme.util,
    color: scheme.color,
  };
}

const DEMO_SCHEMES = DEMO_FUND_SCHEME_SEEDS.map(toFundScheme);

const TOTAL_ALLOCATED_PAISE = DEMO_SCHEMES.reduce((sum, scheme) => sum + scheme.allocatedPaise, 0);
const TOTAL_DISBURSED_PAISE = DEMO_SCHEMES.reduce((sum, scheme) => sum + scheme.disbursedPaise, 0);
const TOTAL_BENEFICIARIES = DEMO_FUND_SCHEME_SEEDS.reduce(
  (sum, seed) => sum + seed.beneficiaries,
  0
);

export const STATE_DEMO_FUNDS_DASHBOARD: StateFundsDashboard = {
  fiscalYearLabel: FY_2026_27_LABEL,
  totalDisbursed: formatStateFundAmount(TOTAL_DISBURSED_PAISE),
  totalAllocatedPaise: TOTAL_ALLOCATED_PAISE,
  fyTotalAllocatedPaise: TOTAL_ALLOCATED_PAISE,
  allocationPercent:
    TOTAL_ALLOCATED_PAISE > 0
      ? Math.round((TOTAL_DISBURSED_PAISE / TOTAL_ALLOCATED_PAISE) * 100)
      : 0,
  beneficiariesPaid: TOTAL_BENEFICIARIES,
  pendingApproval: 12,
  paidOnTimeRate: 94.2,
  schemes: DEMO_SCHEMES,
};

export const STATE_DEMO_FUND_UTILISATION: StateFundUtilisationSummary = {
  rows: DEMO_SCHEMES.map(toUtilisationRow),
  totalDisbursed: formatStateFundAmount(TOTAL_DISBURSED_PAISE),
};
