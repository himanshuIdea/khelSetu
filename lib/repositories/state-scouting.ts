import { cache } from "react";
import { and, asc, desc, eq, gte, ilike, inArray, isNotNull, isNull, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { academies, batches, players, sports } from "@/db/schema";
import { formatWeightKg, getInitials } from "@/lib/format";
import {
  SHORTLIST_REPORT_STATUSES,
  type ScoutingStatus,
} from "@/lib/scouting-status";
import type {
  ScoutingAgeGroup,
  ScoutingPipelineStage,
  ScoutingShortlistReportRow,
  StateScoutingDashboard,
  StateScoutingFilters,
  StateScoutingProspect,
  StateScoutingProspectListResult,
} from "@/lib/state-portal";
import { getStateNurseryContext } from "./state-nursery-helpers";
import { revalidateStateOverviewCache } from "./state-portal-cache";

export const DEFAULT_SCOUTING_PAGE_SIZE = 100;

function nurseryPlayerConditions(academyIds: string[]) {
  return and(
    inArray(players.academyId, academyIds),
    inArray(players.status, ["active", "on_hold"]),
    isNull(academies.deletedAt)
  );
}

type ScoutingStatusCounts = {
  identified: number;
  kheloIndia: number;
  inTrials: number;
  stateCamp: number;
  nationalCamp: number;
  shortlistReport: number;
};

/** Single round-trip for all scouting stat cards + shortlist count. */
async function fetchScoutingStatusCounts(academyIds: string[]): Promise<ScoutingStatusCounts> {
  const [row] = await db
    .select({
      identified: sql<number>`count(*) filter (where ${players.scoutingStatus} is not null)`,
      kheloIndia: sql<number>`count(*) filter (where ${players.scoutingStatus} = 'khelo_india')`,
      inTrials: sql<number>`count(*) filter (where ${players.scoutingStatus} = 'in_trials')`,
      stateCamp: sql<number>`count(*) filter (where ${players.scoutingStatus} = 'shortlisted_for_states')`,
      nationalCamp: sql<number>`count(*) filter (where ${players.scoutingStatus} = 'shortlisted_for_nationals')`,
      shortlistReport: sql<number>`count(*) filter (where ${players.scoutingStatus} in ('khelo_india', 'shortlisted_for_nationals', 'shortlisted_for_states'))`,
    })
    .from(players)
    .innerJoin(academies, eq(players.academyId, academies.id))
    .where(nurseryPlayerConditions(academyIds));

  return {
    identified: Number(row?.identified ?? 0),
    kheloIndia: Number(row?.kheloIndia ?? 0),
    inTrials: Number(row?.inTrials ?? 0),
    stateCamp: Number(row?.stateCamp ?? 0),
    nationalCamp: Number(row?.nationalCamp ?? 0),
    shortlistReport: Number(row?.shortlistReport ?? 0),
  };
}

async function fetchScoutingAgeGroupCounts(academyIds: string[]) {
  return db
    .select({
      batchName: batches.name,
      count: sql<number>`count(*)`,
    })
    .from(players)
    .innerJoin(batches, eq(players.batchId, batches.id))
    .innerJoin(academies, eq(players.academyId, academies.id))
    .where(and(nurseryPlayerConditions(academyIds), isNotNull(players.scoutingStatus)))
    .groupBy(batches.name);
}

type ProspectRow = {
  id: string;
  fullName: string;
  avatarColor: string;
  rating: string | null;
  weightCategory: string | null;
  scoutingStatus: string | null;
  sportName: string;
  batchName: string | null;
  district: string | null;
  nurseryName: string;
};

function mapProspectRow(row: ProspectRow): StateScoutingProspect {
  const weight = row.weightCategory ? formatWeightKg(row.weightCategory) : "";
  const detail = weight ? `${row.sportName} · ${weight}` : row.sportName;

  return {
    playerId: row.id,
    initials: getInitials(row.fullName),
    color: row.avatarColor,
    name: row.fullName,
    detail,
    sport: row.sportName,
    sportName: row.sportName,
    batchName: row.batchName,
    district: row.district ?? "—",
    nurseryName: row.nurseryName,
    score: row.rating ?? "—",
    scoutingStatus: row.scoutingStatus as ScoutingStatus | null,
  };
}

function prospectSelect() {
  return {
    id: players.id,
    fullName: players.fullName,
    avatarColor: players.avatarColor,
    rating: players.rating,
    weightCategory: players.weightCategory,
    scoutingStatus: players.scoutingStatus,
    sportName: sports.name,
    batchName: batches.name,
    district: academies.district,
    nurseryName: academies.name,
  };
}

function prospectFromClause() {
  return db
    .select(prospectSelect())
    .from(players)
    .innerJoin(academies, eq(players.academyId, academies.id))
    .innerJoin(sports, eq(players.sportId, sports.id))
    .leftJoin(batches, eq(players.batchId, batches.id));
}

async function buildScoutingConditions(filters?: StateScoutingFilters) {
  const { academyIds } = await getStateNurseryContext();
  if (academyIds.length === 0) return null;

  const conditions = [nurseryPlayerConditions(academyIds)];

  if (filters?.district && filters.district !== "all") {
    conditions.push(eq(academies.district, filters.district));
  }

  if (filters?.sport && filters.sport !== "all") {
    conditions.push(eq(sports.name, filters.sport));
  }

  if (filters?.ageGroup && filters.ageGroup !== "all") {
    conditions.push(eq(batches.name, filters.ageGroup));
  }

  if (filters?.minRating != null) {
    conditions.push(gte(players.rating, filters.minRating.toFixed(1)));
  }

  const status = filters?.status;
  if (status && status !== "all") {
    if (status === "unmarked") {
      conditions.push(isNull(players.scoutingStatus));
    } else {
      conditions.push(eq(players.scoutingStatus, status as ScoutingStatus));
    }
  }

  const search = filters?.search?.trim();
  if (search) {
    const pattern = `%${search}%`;
    conditions.push(
      or(
        ilike(players.fullName, pattern),
        ilike(sports.name, pattern),
        ilike(academies.district, pattern),
        ilike(academies.name, pattern)
      )!
    );
  }

  return and(...conditions);
}

function prospectOrderBy() {
  return [desc(players.rating), asc(players.id)] as const;
}

export async function listStateScoutingProspectsPage(options: {
  filters?: StateScoutingFilters;
  offset?: number;
  limit?: number;
}): Promise<StateScoutingProspectListResult> {
  const where = await buildScoutingConditions(options.filters);
  if (!where) return { items: [], total: 0 };

  const offset = options.offset ?? 0;
  const limit = options.limit ?? DEFAULT_SCOUTING_PAGE_SIZE;

  const [countRow, rows] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(players)
      .innerJoin(academies, eq(players.academyId, academies.id))
      .innerJoin(sports, eq(players.sportId, sports.id))
      .leftJoin(batches, eq(players.batchId, batches.id))
      .where(where),
    prospectFromClause().where(where).orderBy(...prospectOrderBy()).offset(offset).limit(limit),
  ]);

  return {
    items: rows.map(mapProspectRow),
    total: Number(countRow[0]?.count ?? 0),
  };
}

export const listStateScoutingProspects = cache(async (): Promise<StateScoutingProspect[]> => {
  const { items } = await listStateScoutingProspectsPage({
    offset: 0,
    limit: DEFAULT_SCOUTING_PAGE_SIZE,
  });
  return items;
});

export async function assertPlayerInStateScope(playerId: string): Promise<boolean> {
  const { academyIds } = await getStateNurseryContext();
  if (academyIds.length === 0) return false;

  const [row] = await db
    .select({ id: players.id })
    .from(players)
    .innerJoin(academies, eq(players.academyId, academies.id))
    .where(
      and(
        eq(players.id, playerId),
        inArray(players.academyId, academyIds),
        isNull(academies.deletedAt)
      )
    )
    .limit(1);

  return Boolean(row);
}

export async function updatePlayerScoutingStatus(
  playerId: string,
  status: ScoutingStatus | null
): Promise<void> {
  const inScope = await assertPlayerInStateScope(playerId);
  if (!inScope) {
    throw new Error("Player not found in state nursery scope.");
  }

  await db
    .update(players)
    .set({
      scoutingStatus: status,
      scoutingStatusSetAt: status ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(players.id, playerId));

  revalidateStateOverviewCache();
}

export async function bulkUpdatePlayerScoutingStatus(
  playerIds: string[],
  status: ScoutingStatus
): Promise<number> {
  if (playerIds.length === 0) return 0;

  const { academyIds } = await getStateNurseryContext();
  if (academyIds.length === 0) return 0;

  const scopedRows = await db
    .select({ id: players.id })
    .from(players)
    .innerJoin(academies, eq(players.academyId, academies.id))
    .where(
      and(
        inArray(players.id, playerIds),
        inArray(players.academyId, academyIds),
        isNull(academies.deletedAt)
      )
    );

  const scopedIds = scopedRows.map((r) => r.id);
  if (scopedIds.length === 0) return 0;

  const now = new Date();
  await db
    .update(players)
    .set({
      scoutingStatus: status,
      scoutingStatusSetAt: now,
      updatedAt: now,
    })
    .where(inArray(players.id, scopedIds));

  revalidateStateOverviewCache();
  return scopedIds.length;
}

export const countShortlistReportRows = cache(async (): Promise<number> => {
  const { academyIds } = await getStateNurseryContext();
  if (academyIds.length === 0) return 0;

  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(players)
    .innerJoin(academies, eq(players.academyId, academies.id))
    .where(
      and(
        nurseryPlayerConditions(academyIds),
        inArray(players.scoutingStatus, SHORTLIST_REPORT_STATUSES)
      )
    );

  return Number(row?.count ?? 0);
});

export const getStateScoutingDashboard = cache(async (): Promise<StateScoutingDashboard> => {
  const { academyIds } = await getStateNurseryContext();

  const empty: StateScoutingDashboard = {
    prospectsIdentified: 0,
    shortlistedCount: 0,
    inCampsCount: 0,
    nationalCampRate: 0,
    pipeline: [],
    ageGroups: [],
    shortlistReportCount: 0,
  };

  if (academyIds.length === 0) return empty;

  const [counts, batchRows] = await Promise.all([
    fetchScoutingStatusCounts(academyIds),
    fetchScoutingAgeGroupCounts(academyIds),
  ]);

  const {
    identified,
    kheloIndia,
    inTrials,
    stateCamp: stateCampCount,
    nationalCamp,
    shortlistReport: shortlistReportCount,
  } = counts;

  const pipelineBase = identified || 1;
  const pipeline: ScoutingPipelineStage[] = [
    {
      label: "Identified",
      value: identified.toLocaleString("en-IN"),
      count: identified,
      percent: 100,
      color: "#FF6B2C",
    },
    {
      label: "In trials",
      value: inTrials.toLocaleString("en-IN"),
      count: inTrials,
      percent: Math.round((inTrials / pipelineBase) * 100),
      color: "#F5A623",
    },
    {
      label: "State camp",
      value: stateCampCount.toLocaleString("en-IN"),
      count: stateCampCount,
      percent: Math.round((stateCampCount / pipelineBase) * 100),
      color: "#2F6BFF",
    },
    {
      label: "National camp",
      value: nationalCamp.toLocaleString("en-IN"),
      count: nationalCamp,
      percent: Math.round((nationalCamp / pipelineBase) * 100),
      color: "#12B886",
    },
  ];

  const ageGroupMap: Record<string, { label: string; color: string }> = {
    "Sub-junior": { label: "Sub-junior (U-15)", color: "var(--brand)" },
    Junior: { label: "Junior (U-18)", color: "var(--blue)" },
    Senior: { label: "Senior", color: "var(--purple)" },
  };

  const ageGroups: ScoutingAgeGroup[] = ["Sub-junior", "Junior", "Senior"].map((name) => {
    const row = batchRows.find((r) => r.batchName === name);
    const meta = ageGroupMap[name]!;
    return {
      label: meta.label,
      count: Number(row?.count ?? 0),
      color: meta.color,
    };
  });

  const nationalCampRate =
    identified > 0 ? Math.round((nationalCamp / identified) * 100) : 0;

  return {
    prospectsIdentified: identified,
    shortlistedCount: kheloIndia,
    inCampsCount: stateCampCount,
    nationalCampRate,
    pipeline,
    ageGroups,
    shortlistReportCount,
  };
});

export async function listShortlistReportRows(): Promise<ScoutingShortlistReportRow[]> {
  const { academyIds } = await getStateNurseryContext();
  if (academyIds.length === 0) return [];

  const rows = await db
    .select({
      id: players.id,
      fullName: players.fullName,
      rating: players.rating,
      weightCategory: players.weightCategory,
      scoutingStatus: players.scoutingStatus,
      sportName: sports.name,
      batchName: batches.name,
      district: academies.district,
      nurseryName: academies.name,
    })
    .from(players)
    .innerJoin(academies, eq(players.academyId, academies.id))
    .innerJoin(sports, eq(players.sportId, sports.id))
    .leftJoin(batches, eq(players.batchId, batches.id))
    .where(
      and(
        nurseryPlayerConditions(academyIds),
        inArray(players.scoutingStatus, SHORTLIST_REPORT_STATUSES)
      )
    )
    .orderBy(desc(players.rating));

  return rows
    .filter((row): row is typeof row & { scoutingStatus: ScoutingStatus } =>
      row.scoutingStatus != null
    )
    .map((row) => {
      const weight = row.weightCategory ? formatWeightKg(row.weightCategory) : "";
      const weightBatch = [weight, row.batchName].filter(Boolean).join(" · ") || "—";

      return {
        playerId: row.id,
        athlete: row.fullName,
        sport: row.sportName,
        weightBatch,
        district: row.district,
        nursery: row.nurseryName,
        score: row.rating ?? "—",
        status: row.scoutingStatus,
      };
    });
}
