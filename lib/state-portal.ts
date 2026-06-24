import type { GrantStatusFilter } from "@/lib/state-fund-filters";
import type { ScoutingStatus } from "@/lib/scouting-status";
import type { NurseryPillVariant } from "@/lib/state-nurseries";

export type StateSummary = {
  nurseryCount: number;
  athleteCount: number;
  coachCount: number;
  verifiedCount: number;
  pendingCount: number;
  flaggedCount: number;
  verifiedRate: number;
};

export type VerificationBreakdown = {
  verified: number;
  pending: number;
  flagged: number;
  rate: number;
};

export type SportLegendItem = {
  label: string;
  color: string;
};

export type DistrictSportBar = {
  district: string;
  total: string;
  totalCount: number;
  segments: number[];
};

export type TalentPipelineRow = {
  name: string;
  sport: string;
  district: string;
  category: string;
  score: string;
  avatarColor: string;
};

export type StateAthleteListItem = {
  id: string;
  initials: string;
  name: string;
  detail: string;
  sport: string;
  district: string;
  rating: string;
  color: string;
};

export type StateAthleteFilters = {
  sport?: string;
  district?: string;
  minRating?: number;
  search?: string;
};

export type StateAthleteListResult = {
  items: StateAthleteListItem[];
  total: number;
};

export type StateAthleteReportRow = {
  playerId: string;
  name: string;
  age: string;
  sport: string;
  weight: string;
  height: string;
  batch: string;
  district: string;
  nursery: string;
  score: string;
  playerStatus: string;
  scoutingStatus: string;
  primaryCoach: string;
  joined: string;
};

export type StateAthleteReportFilters = StateAthleteFilters;

export const STATE_ATHLETE_ROSTER_REPORT_MAX_ROWS = 5000;

export type StateDistrictRow = {
  name: string;
  nurseries: number;
  athletes: string;
  athleteCount: number;
  verifiedCount: number;
  /** 0–100 when nurseries > 0; null when there are no nurseries in the district. */
  verificationRate: number | null;
  /** Display label, e.g. `4/5 (80%)`. */
  verified: string;
  coaches: number;
};

export type ScoutingPipelineStage = {
  label: string;
  value: string;
  count: number;
  percent: number;
  color: string;
};

export type ScoutingAgeGroup = {
  label: string;
  count: number;
  color: string;
};

export type StateScoutingProspect = {
  playerId: string;
  initials: string;
  color: string;
  name: string;
  detail: string;
  sport: string;
  sportName: string;
  batchName: string | null;
  district: string;
  nurseryName: string;
  score: string;
  scoutingStatus: ScoutingStatus | null;
};

export type StateScoutingFilters = {
  sport?: string;
  district?: string;
  ageGroup?: string;
  minRating?: number;
  search?: string;
  /** `all` | `unmarked` | a scouting status value */
  status?: string;
};

export type StateScoutingProspectListResult = {
  items: StateScoutingProspect[];
  total: number;
};

export type ScoutingShortlistReportRow = {
  playerId: string;
  athlete: string;
  sport: string;
  weightBatch: string;
  district: string;
  nursery: string;
  score: string;
  status: ScoutingStatus;
};

export type StateScoutingDashboard = {
  prospectsIdentified: number;
  shortlistedCount: number;
  inCampsCount: number;
  nationalCampRate: number;
  pipeline: ScoutingPipelineStage[];
  ageGroups: ScoutingAgeGroup[];
  shortlistReportCount: number;
};

export type StateFundScheme = {
  id: string;
  slug: string;
  name: string;
  detail: string;
  beneficiaryType: "athlete" | "coach" | "nursery";
  beneficiaries: string;
  allocated: string;
  allocatedPaise: number;
  disbursed: string;
  disbursedPaise: number;
  util: number;
  color: string;
};

export type StateFundsDashboard = {
  fiscalYearLabel: string;
  totalDisbursed: string;
  /** FY-level total when set (>0), else sum of scheme allocations — used for % of allocation. */
  totalAllocatedPaise: number;
  /** Raw FY total from `state_fiscal_years` (editable via header pill). */
  fyTotalAllocatedPaise: number;
  allocationPercent: number;
  beneficiariesPaid: number;
  pendingApproval: number;
  paidOnTimeRate: number;
  schemes: StateFundScheme[];
};

export type StateFundGrantSummary = {
  status: "none" | "pending" | "paid";
  amountPaise: number;
  disbursementId: string | null;
};

export type StateFundAthleteBeneficiaryRow = {
  id: string;
  initials: string;
  name: string;
  detail: string;
  sport: string;
  district: string;
  nurseryName: string;
  color: string;
  grant: StateFundGrantSummary;
};

export type StateFundCoachBeneficiaryRow = {
  id: string;
  initials: string;
  name: string;
  detail: string;
  sport: string;
  district: string;
  nurseryName: string;
  nisLevel: string;
  color: string;
  grant: StateFundGrantSummary;
};

export type StateFundNurseryBeneficiaryRow = {
  academyId: string;
  initials: string;
  name: string;
  detail: string;
  district: string;
  sportLabel: string;
  athletes: string;
  color: string;
  grant: StateFundGrantSummary;
};

export type StateFundSchemeDetail = {
  scheme: StateFundScheme;
  fiscalYearLabel: string;
  athleteBeneficiaries?: StateFundAthleteBeneficiaryRow[];
  coachBeneficiaries?: StateFundCoachBeneficiaryRow[];
  nurseryBeneficiaries?: StateFundNurseryBeneficiaryRow[];
};

export type StateFundSchemeHeader = {
  scheme: StateFundScheme;
  fiscalYearLabel: string;
};

export type StateFundBeneficiaryFilters = {
  district?: string;
  sport?: string;
  grant?: GrantStatusFilter;
  nursery?: string;
  nis?: string;
  search?: string;
};

export type StateFundBeneficiaryListResult =
  | {
      beneficiaryType: "athlete";
      items: StateFundAthleteBeneficiaryRow[];
      total: number;
    }
  | {
      beneficiaryType: "coach";
      items: StateFundCoachBeneficiaryRow[];
      total: number;
    }
  | {
      beneficiaryType: "nursery";
      items: StateFundNurseryBeneficiaryRow[];
      total: number;
    };

export type FundUtilisationRow = {
  label: string;
  value: string;
  percent: number;
  color: string;
};

export type StateFundUtilisationSummary = {
  rows: FundUtilisationRow[];
  totalDisbursed: string;
};

export type StateReportsDashboard = {
  generatedThisMonth: number;
  scheduledExports: number;
  pendingReview: number;
  complianceCoverage: number;
  totalExports: number;
};

export type StateOverviewData = {
  summary: StateSummary;
  verification: VerificationBreakdown;
  districtBars: DistrictSportBar[];
  sportLegend: SportLegendItem[];
  talentPipeline: TalentPipelineRow[];
  fundUtilisation: StateFundUtilisationSummary;
  hasData: boolean;
};

export type VerificationListRow = {
  academyId: string;
  initials: string;
  color: string;
  name: string;
  district: string;
  athletes: string;
  status: NurseryPillVariant;
  statusLabel: string;
  highlighted: boolean;
};
