import { cache } from "react";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { formatCompactCount, formatPaise } from "@/lib/format";
import type {
  DistrictSportBar,
  SportLegendItem,
  StateFundUtilisationSummary,
  StateOverviewData,
  StateSummary,
  TalentPipelineRow,
  VerificationBreakdown,
} from "@/lib/state-portal";
import type { NurseryVerificationStatus } from "@/lib/state-nurseries";
import { getStateNurseryContext } from "./state-nursery-helpers";
import {
  activeNurseryPlayersCte,
  listedNurseriesCte,
} from "./state-overview-sql";
import { cacheStateOverviewSnapshot } from "./state-portal-cache";

const SEGMENT_COLORS = ["#FF6B2C", "#2F6BFF", "#7C5CFC", "#12B886", "#9AA4B8"];
const TALENT_PIPELINE_LIMIT = 8;

type DistrictSportRow = {
  district: string;
  sportName: string;
  count: number;
};

type DistrictSportJson = {
  district: string;
  sportName: string;
  count: number;
};

type TalentPipelineJson = {
  fullName: string;
  rating: string | null;
  avatarColor: string;
  weightCategory: string | null;
  sportName: string;
  district: string;
  batchName: string | null;
};

type FundSchemeRow = {
  name: string;
  color: string;
  allocated_amount_paise: number;
  paid_paise: number;
};

function parseJsonColumn<T>(value: unknown): T[] {
  if (value == null) return [];
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function verificationFromMap(
  verificationMap: Map<string, NurseryVerificationStatus>
): VerificationBreakdown {
  let verified = 0;
  let pending = 0;
  let flagged = 0;

  for (const status of verificationMap.values()) {
    if (status === "verified") verified += 1;
    else if (status === "pending") pending += 1;
    else if (status === "flagged") flagged += 1;
  }

  const total = verified + pending + flagged;
  const rate = total > 0 ? Math.round((verified / total) * 100) : 0;

  return { verified, pending, flagged, rate };
}

function buildSportSegments(
  sportCounts: Map<string, number>,
  topSports: string[]
): number[] {
  const total = [...sportCounts.values()].reduce((sum, n) => sum + n, 0);
  if (total === 0) return [100, 0, 0, 0, 0];

  const segments: number[] = [];
  let assigned = 0;

  for (let i = 0; i < 4; i++) {
    const sport = topSports[i];
    const count = sport ? (sportCounts.get(sport) ?? 0) : 0;
    const pct = Math.round((count / total) * 100);
    segments.push(pct);
    assigned += pct;
  }

  const otherPct = Math.max(0, 100 - assigned);
  segments.push(otherPct);
  return segments;
}

function rankSportsByCount(rows: DistrictSportRow[]) {
  const bySport = new Map<string, number>();
  for (const row of rows) {
    bySport.set(row.sportName, (bySport.get(row.sportName) ?? 0) + row.count);
  }

  return [...bySport.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([sportName, count]) => ({ sportName, count }));
}

function buildSportLegend(rankedSports: { sportName: string }[]): SportLegendItem[] {
  const top = rankedSports.slice(0, 4).map((row, index) => ({
    label: row.sportName,
    color: SEGMENT_COLORS[index] ?? SEGMENT_COLORS[4]!,
  }));

  if (rankedSports.length > 4) {
    top.push({ label: "Other", color: SEGMENT_COLORS[4]! });
  }

  return top;
}

function buildDistrictBars(
  rows: DistrictSportRow[],
  topSports: string[],
  limit: number
): DistrictSportBar[] {
  const districtTotals = new Map<string, number>();
  const sportCountsByDistrict = new Map<string, Map<string, number>>();

  for (const row of rows) {
    districtTotals.set(row.district, (districtTotals.get(row.district) ?? 0) + row.count);

    let sportCounts = sportCountsByDistrict.get(row.district);
    if (!sportCounts) {
      sportCounts = new Map();
      sportCountsByDistrict.set(row.district, sportCounts);
    }
    sportCounts.set(row.sportName, row.count);
  }

  const topDistricts = [...districtTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  if (topDistricts.length === 0) return [];

  return topDistricts.map(([district, totalCount]) => {
    const sportCounts = sportCountsByDistrict.get(district) ?? new Map<string, number>();
    return {
      district,
      total: formatCompactCount(totalCount),
      totalCount,
      segments: buildSportSegments(sportCounts, topSports),
    };
  });
}

function utilPercent(paid: number, allocated: number): number {
  if (allocated <= 0) return 0;
  return Math.round((paid / allocated) * 100);
}

/**
 * One round-trip for player panels — joins `listed_nurseries` instead of IN(uuid[]).
 * Avoids large academy id lists and duplicate player table scans.
 */
async function fetchPlayerOverviewBundle() {
  const rows = await db.execute<{
    athlete_count: number;
    coach_count: number;
    district_sport: unknown;
    talent: unknown;
  }>(sql`
    WITH ${listedNurseriesCte},
    ${activeNurseryPlayersCte},
    district_sport AS (
      SELECT district, sport_name, COUNT(*)::int AS cnt
      FROM scoped_players
      GROUP BY district, sport_name
    ),
    talent AS (
      SELECT * FROM scoped_players
      ORDER BY rating DESC NULLS LAST
      LIMIT ${TALENT_PIPELINE_LIMIT}
    )
    SELECT
      (SELECT COUNT(*)::int FROM scoped_players) AS athlete_count,
      (
        SELECT COUNT(*)::int
        FROM people.coaches c
        INNER JOIN listed_nurseries ln ON ln.academy_id = c.academy_id
      ) AS coach_count,
      (
        SELECT COALESCE(json_agg(json_build_object(
          'district', ds.district,
          'sportName', ds.sport_name,
          'count', ds.cnt
        )), '[]'::json)
        FROM district_sport ds
      ) AS district_sport,
      (
        SELECT COALESCE(json_agg(json_build_object(
          'fullName', t.full_name,
          'rating', t.rating,
          'avatarColor', t.avatar_color,
          'weightCategory', t.weight_category,
          'sportName', t.sport_name,
          'district', t.district,
          'batchName', t.batch_name
        )), '[]'::json)
        FROM talent t
      ) AS talent
  `);

  const row = rows[0];
  if (!row) {
    return {
      athletes: 0,
      coaches: 0,
      districtSportRows: [] as DistrictSportRow[],
      talentPipeline: [] as TalentPipelineRow[],
    };
  }

  const districtSport = parseJsonColumn<DistrictSportJson>(row.district_sport);
  const talentRows = parseJsonColumn<TalentPipelineJson>(row.talent);

  return {
    athletes: Number(row.athlete_count ?? 0),
    coaches: Number(row.coach_count ?? 0),
    districtSportRows: districtSport.map((entry) => ({
      district: entry.district,
      sportName: entry.sportName,
      count: Number(entry.count),
    })),
    talentPipeline: talentRows.map((entry) => ({
      name: entry.fullName,
      sport: entry.weightCategory
        ? `${entry.sportName} · ${entry.weightCategory}`
        : entry.sportName,
      district: entry.district,
      category: entry.batchName ?? "—",
      score: entry.rating ?? "—",
      avatarColor: entry.avatarColor,
    })),
  };
}

/** One round-trip: active FY schemes + paid disbursement totals. */
async function fetchFundUtilisationSummaryFast(): Promise<StateFundUtilisationSummary> {
  const rows = await db.execute<FundSchemeRow>(sql`
    SELECT
      s.name,
      s.color,
      s.allocated_amount_paise,
      COALESCE(SUM(d.amount_paise) FILTER (WHERE d.status = 'paid'), 0)::bigint AS paid_paise
    FROM platform.state_fiscal_years fy
    INNER JOIN platform.state_fund_schemes s ON s.fiscal_year_id = fy.id
    LEFT JOIN platform.state_fund_disbursements d ON d.scheme_id = s.id
    WHERE fy.is_active = true
    GROUP BY s.id, s.name, s.color, s.allocated_amount_paise, s.sort_order
    ORDER BY s.sort_order
    LIMIT 5
  `);

  if (rows.length === 0) {
    return { rows: [], totalDisbursed: "₹0" };
  }

  let totalPaise = 0;
  const fundRows = rows.map((scheme) => {
    const disbursedPaise = Number(scheme.paid_paise ?? 0);
    const allocated = Number(scheme.allocated_amount_paise ?? 0);
    totalPaise += disbursedPaise;
    const util = utilPercent(disbursedPaise, allocated);
    return {
      label: scheme.name,
      value: `${util}%`,
      percent: util,
      color: scheme.color,
    };
  });

  return {
    rows: fundRows,
    totalDisbursed: formatPaise(totalPaise),
  };
}

function emptySummary(verification: VerificationBreakdown): StateSummary {
  return {
    nurseryCount: 0,
    athleteCount: 0,
    coachCount: 0,
    verifiedCount: verification.verified,
    pendingCount: verification.pending,
    flaggedCount: verification.flagged,
    verifiedRate: verification.rate,
  };
}

/** Cold path: 3 serial round-trips (nursery map cache, player bundle, funds). */
async function fetchStateOverviewUncached(): Promise<StateOverviewData> {
  const { verificationByAcademy, academyIds } = await getStateNurseryContext();
  const verification = verificationFromMap(verificationByAcademy);

  if (academyIds.length === 0) {
    const fundUtilisation = await fetchFundUtilisationSummaryFast();
    return {
      summary: emptySummary(verification),
      verification,
      districtBars: [],
      sportLegend: [],
      talentPipeline: [],
      fundUtilisation,
      hasData: false,
    };
  }

  const playerBundle = await fetchPlayerOverviewBundle();
  const fundUtilisation = await fetchFundUtilisationSummaryFast();

  const { districtSportRows, talentPipeline } = playerBundle;
  const rankedSports = rankSportsByCount(districtSportRows);
  const topSports = rankedSports.slice(0, 4).map((row) => row.sportName);
  const sportLegend = buildSportLegend(rankedSports);
  const districtBars = buildDistrictBars(districtSportRows, topSports, 6);

  const summary: StateSummary = {
    nurseryCount: academyIds.length,
    athleteCount: playerBundle.athletes,
    coachCount: playerBundle.coaches,
    verifiedCount: verification.verified,
    pendingCount: verification.pending,
    flaggedCount: verification.flagged,
    verifiedRate: verification.rate,
  };

  const hasData = summary.nurseryCount > 0 || summary.athleteCount > 0;

  return {
    summary,
    verification,
    districtBars,
    sportLegend,
    talentPipeline,
    fundUtilisation,
    hasData,
  };
}

export async function getCachedStateOverview(): Promise<StateOverviewData> {
  return cacheStateOverviewSnapshot(fetchStateOverviewUncached);
}

export const getVerificationBreakdown = cache(async (): Promise<VerificationBreakdown> => {
  const { verificationByAcademy } = await getStateNurseryContext();
  return verificationFromMap(verificationByAcademy);
});

export const getStateSummary = cache(async (): Promise<StateSummary> => {
  const overview = await getCachedStateOverview();
  return overview.summary;
});

export const getSportLegend = cache(async (): Promise<SportLegendItem[]> => {
  const overview = await getCachedStateOverview();
  return overview.sportLegend;
});

export const getDistrictAthleteSportBreakdown = cache(
  async (limit = 6): Promise<DistrictSportBar[]> => {
    const overview = await getCachedStateOverview();
    return overview.districtBars.slice(0, limit);
  }
);

export const getTalentPipeline = cache(async (limit = 8): Promise<TalentPipelineRow[]> => {
  const overview = await getCachedStateOverview();
  return overview.talentPipeline.slice(0, limit);
});

export const getFundUtilisationSummary = cache(async (): Promise<StateFundUtilisationSummary> => {
  const overview = await getCachedStateOverview();
  return overview.fundUtilisation;
});

export const getStateOverview = cache(async (): Promise<StateOverviewData> => {
  return getCachedStateOverview();
});

export { talentPipelineInitials, verificationDonutSegments } from "@/lib/state-overview-ui";
