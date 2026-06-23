import { cache } from "react";
import { and, desc, eq, gte, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  academies,
  batches,
  coaches,
  players,
  sports,
} from "@/db/schema";
import { formatCompactCount, formatPaise, getInitials } from "@/lib/format";
import type {
  DistrictSportBar,
  SportLegendItem,
  StateFundUtilisationSummary,
  StateOverviewData,
  StateSummary,
  TalentPipelineRow,
  VerificationBreakdown,
} from "@/lib/state-portal";
import {
  getAthleteCountByAcademy,
  getStateNurseryContext,
} from "./state-nursery-helpers";
import {
  getActiveFiscalYear,
  getTotalStateFundDisbursedPaise,
  listActiveFundSchemeUtilisation,
} from "./state-funds";

const SEGMENT_COLORS = ["#FF6B2C", "#2F6BFF", "#7C5CFC", "#12B886", "#9AA4B8"];

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

export const getVerificationBreakdown = cache(async (): Promise<VerificationBreakdown> => {
  const { verificationByAcademy: verificationMap } = await getStateNurseryContext();
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
});

export const getStateSummary = cache(async (): Promise<StateSummary> => {
  const [{ academyIds }, verification] = await Promise.all([
    getStateNurseryContext(),
    getVerificationBreakdown(),
  ]);

  if (academyIds.length === 0) {
    return {
      nurseryCount: 0,
      athleteCount: 0,
      coachCount: 0,
      verifiedCount: 0,
      pendingCount: 0,
      flaggedCount: 0,
      verifiedRate: 0,
    };
  }

  const [athleteRows, coachRows] = await Promise.all([
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
    nurseryCount: academyIds.length,
    athleteCount: Number(athleteRows[0]?.count ?? 0),
    coachCount: Number(coachRows[0]?.count ?? 0),
    verifiedCount: verification.verified,
    pendingCount: verification.pending,
    flaggedCount: verification.flagged,
    verifiedRate: verification.rate,
  };
});

export const getSportLegend = cache(async (): Promise<SportLegendItem[]> => {
  const { academyIds } = await getStateNurseryContext();
  if (academyIds.length === 0) return [];

  const rows = await db
    .select({
      sportName: sports.name,
      count: sql<number>`count(*)`,
    })
    .from(players)
    .innerJoin(sports, eq(players.sportId, sports.id))
    .where(
      and(
        inArray(players.academyId, academyIds),
        inArray(players.status, ["active", "on_hold"])
      )
    )
    .groupBy(sports.name)
    .orderBy(desc(sql`count(*)`));

  const top = rows.slice(0, 4).map((row, index) => ({
    label: row.sportName,
    color: SEGMENT_COLORS[index] ?? SEGMENT_COLORS[4]!,
  }));

  if (rows.length > 4) {
    top.push({ label: "Other", color: SEGMENT_COLORS[4]! });
  }

  return top;
});

export const getDistrictAthleteSportBreakdown = cache(
  async (limit = 6): Promise<DistrictSportBar[]> => {
    const { academyIds } = await getStateNurseryContext();
    if (academyIds.length === 0) return [];

    const globalSportRows = await db
      .select({
        sportName: sports.name,
        count: sql<number>`count(*)`,
      })
      .from(players)
      .innerJoin(sports, eq(players.sportId, sports.id))
      .where(
        and(
          inArray(players.academyId, academyIds),
          inArray(players.status, ["active", "on_hold"])
        )
      )
      .groupBy(sports.name)
      .orderBy(desc(sql`count(*)`));

    const topSports = globalSportRows.slice(0, 4).map((r) => r.sportName);

    const districtSportRows = await db
      .select({
        district: academies.district,
        sportName: sports.name,
        count: sql<number>`count(*)`,
      })
      .from(players)
      .innerJoin(academies, eq(players.academyId, academies.id))
      .innerJoin(sports, eq(players.sportId, sports.id))
      .where(
        and(
          inArray(players.academyId, academyIds),
          inArray(players.status, ["active", "on_hold"]),
          isNull(academies.deletedAt)
        )
      )
      .groupBy(academies.district, sports.name);

    const districtTotals = new Map<string, number>();
    const sportCountsByDistrict = new Map<string, Map<string, number>>();

    for (const row of districtSportRows) {
      const count = Number(row.count);
      districtTotals.set(row.district, (districtTotals.get(row.district) ?? 0) + count);

      let sportCounts = sportCountsByDistrict.get(row.district);
      if (!sportCounts) {
        sportCounts = new Map();
        sportCountsByDistrict.set(row.district, sportCounts);
      }
      sportCounts.set(row.sportName, count);
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
);

export const getTalentPipeline = cache(async (limit = 8): Promise<TalentPipelineRow[]> => {
  const { academyIds } = await getStateNurseryContext();
  if (academyIds.length === 0) return [];

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
    .where(
      and(
        inArray(players.academyId, academyIds),
        inArray(players.status, ["active", "on_hold"]),
        isNull(academies.deletedAt)
      )
    )
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
});

export const getFundUtilisationSummary = cache(async (): Promise<StateFundUtilisationSummary> => {
  const fy = await getActiveFiscalYear();
  if (!fy) {
    return { rows: [], totalDisbursed: "₹0" };
  }

  const [rows, totalPaise] = await Promise.all([
    listActiveFundSchemeUtilisation(),
    getTotalStateFundDisbursedPaise(),
  ]);

  return {
    rows: rows.slice(0, 5),
    totalDisbursed: formatPaise(totalPaise),
  };
});

export const getStateOverview = cache(async (): Promise<StateOverviewData> => {
  const [summary, verification, districtBars, sportLegend, talentPipeline, fundUtilisation] =
    await Promise.all([
      getStateSummary(),
      getVerificationBreakdown(),
      getDistrictAthleteSportBreakdown(6),
      getSportLegend(),
      getTalentPipeline(8),
      getFundUtilisationSummary(),
    ]);

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
});

/** Donut chart stroke segments for verification ring (circumference ≈ 339). */
export function verificationDonutSegments(breakdown: VerificationBreakdown): {
  verifiedDash: string;
  pendingDash: string;
  flaggedDash: string;
  verifiedOffset: number;
  pendingOffset: number;
  flaggedOffset: number;
} {
  const circumference = 339;
  const total = breakdown.verified + breakdown.pending + breakdown.flagged;
  if (total === 0) {
    return {
      verifiedDash: `0 ${circumference}`,
      pendingDash: `0 ${circumference}`,
      flaggedDash: `0 ${circumference}`,
      verifiedOffset: 0,
      pendingOffset: 0,
      flaggedOffset: 0,
    };
  }

  const verifiedLen = (breakdown.verified / total) * circumference;
  const pendingLen = (breakdown.pending / total) * circumference;
  const flaggedLen = (breakdown.flagged / total) * circumference;

  return {
    verifiedDash: `${verifiedLen.toFixed(1)} ${(circumference - verifiedLen).toFixed(1)}`,
    pendingDash: `${pendingLen.toFixed(1)} ${(circumference - pendingLen).toFixed(1)}`,
    flaggedDash: `${flaggedLen.toFixed(1)} ${(circumference - flaggedLen).toFixed(1)}`,
    verifiedOffset: 0,
    pendingOffset: -verifiedLen,
    flaggedOffset: -(verifiedLen + pendingLen),
  };
}

export function talentPipelineInitials(name: string): string {
  return getInitials(name);
}
