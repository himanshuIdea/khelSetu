import { cache } from "react";
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  academies,
  batches,
  coaches,
  players,
  sports,
  stateFundDisbursements,
  stateFundSchemes,
} from "@/db/schema";
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
import { getActiveFiscalYear } from "./state-funds";
import { cacheStateOverviewSnapshot } from "./state-portal-cache";

const SEGMENT_COLORS = ["#FF6B2C", "#2F6BFF", "#7C5CFC", "#12B886", "#9AA4B8"];

type DistrictSportRow = {
  district: string;
  sportName: string;
  count: number;
};

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

const nurseryPlayerScope = (academyIds: string[]) =>
  and(
    inArray(players.academyId, academyIds),
    inArray(players.status, ["active", "on_hold"]),
    isNull(academies.deletedAt)
  );

async function fetchDistrictSportRows(academyIds: string[]): Promise<DistrictSportRow[]> {
  const rows = await db
    .select({
      district: academies.district,
      sportName: sports.name,
      count: sql<number>`count(*)`,
    })
    .from(players)
    .innerJoin(academies, eq(players.academyId, academies.id))
    .innerJoin(sports, eq(players.sportId, sports.id))
    .where(nurseryPlayerScope(academyIds))
    .groupBy(academies.district, sports.name);

  return rows.map((row) => ({
    district: row.district,
    sportName: row.sportName,
    count: Number(row.count),
  }));
}

async function fetchAthleteCoachCounts(academyIds: string[]) {
  const [athleteRow, coachRow] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(players)
      .where(
        and(
          inArray(players.academyId, academyIds),
          inArray(players.status, ["active", "on_hold"])
        )
      ),
    db
      .select({ count: sql<number>`count(*)` })
      .from(coaches)
      .where(inArray(coaches.academyId, academyIds)),
  ]);

  return {
    athletes: Number(athleteRow[0]?.count ?? 0),
    coaches: Number(coachRow[0]?.count ?? 0),
  };
}

async function fetchTalentPipelineRows(
  academyIds: string[],
  limit: number
): Promise<TalentPipelineRow[]> {
  const rows = await db
    .select({
      fullName: players.fullName,
      rating: players.rating,
      avatarColor: players.avatarColor,
      weightCategory: players.weightCategory,
      sportName: sports.name,
      district: academies.district,
      batchName: batches.name,
    })
    .from(players)
    .innerJoin(academies, eq(players.academyId, academies.id))
    .innerJoin(sports, eq(players.sportId, sports.id))
    .leftJoin(batches, eq(players.batchId, batches.id))
    .where(nurseryPlayerScope(academyIds))
    .orderBy(desc(players.rating))
    .limit(limit);

  return rows.map((row) => ({
    name: row.fullName,
    sport: row.weightCategory
      ? `${row.sportName} · ${row.weightCategory}`
      : row.sportName,
    district: row.district,
    category: row.batchName ?? "—",
    score: row.rating ?? "—",
    avatarColor: row.avatarColor,
  }));
}

function utilPercent(paid: number, allocated: number): number {
  if (allocated <= 0) return 0;
  return Math.round((paid / allocated) * 100);
}

/** Two-query fund panel for overview (schemes + paid totals). */
async function fetchFundUtilisationSummaryFast(): Promise<StateFundUtilisationSummary> {
  const fy = await getActiveFiscalYear();
  if (!fy) {
    return { rows: [], totalDisbursed: "₹0" };
  }

  const [schemeRows, paidRows] = await Promise.all([
    db
      .select({
        id: stateFundSchemes.id,
        name: stateFundSchemes.name,
        color: stateFundSchemes.color,
        allocatedAmountPaise: stateFundSchemes.allocatedAmountPaise,
      })
      .from(stateFundSchemes)
      .where(eq(stateFundSchemes.fiscalYearId, fy.id))
      .orderBy(stateFundSchemes.sortOrder),
    db
      .select({
        schemeId: stateFundDisbursements.schemeId,
        total: sql<number>`coalesce(sum(${stateFundDisbursements.amountPaise}), 0)`,
      })
      .from(stateFundDisbursements)
      .innerJoin(stateFundSchemes, eq(stateFundDisbursements.schemeId, stateFundSchemes.id))
      .where(
        and(eq(stateFundSchemes.fiscalYearId, fy.id), eq(stateFundDisbursements.status, "paid"))
      )
      .groupBy(stateFundDisbursements.schemeId),
  ]);

  if (schemeRows.length === 0) {
    return { rows: [], totalDisbursed: "₹0" };
  }

  const paidByScheme = new Map(paidRows.map((row) => [row.schemeId, Number(row.total ?? 0)]));
  let totalPaise = 0;

  const rows = schemeRows
    .map((scheme) => {
      const disbursedPaise = paidByScheme.get(scheme.id) ?? 0;
      totalPaise += disbursedPaise;
      const util = utilPercent(disbursedPaise, scheme.allocatedAmountPaise);
      return {
        label: scheme.name,
        value: `${util}%`,
        percent: util,
        color: scheme.color,
      };
    })
    .slice(0, 5);

  return {
    rows,
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

/** Consolidated overview fetch — minimal DB round-trips (no duplicate sport scans). */
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

  const [counts, districtSportRows, talentPipeline, fundUtilisation] = await Promise.all([
    fetchAthleteCoachCounts(academyIds),
    fetchDistrictSportRows(academyIds),
    fetchTalentPipelineRows(academyIds, 8),
    fetchFundUtilisationSummaryFast(),
  ]);

  const rankedSports = rankSportsByCount(districtSportRows);
  const topSports = rankedSports.slice(0, 4).map((row) => row.sportName);
  const sportLegend = buildSportLegend(rankedSports);
  const districtBars = buildDistrictBars(districtSportRows, topSports, 6);

  const summary: StateSummary = {
    nurseryCount: academyIds.length,
    athleteCount: counts.athletes,
    coachCount: counts.coaches,
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
