import { cache } from "react";
import { and, asc, desc, eq, gte, ilike, inArray, isNull, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { academies, batches, coaches, players, sports } from "@/db/schema";
import { formatAge, formatWeightKg, getInitials } from "@/lib/format";
import { scoutingStatusLabel, type ScoutingStatus } from "@/lib/scouting-status";
import type {
  StateAthleteFilters,
  StateAthleteListItem,
  StateAthleteListResult,
  StateAthleteReportRow,
} from "@/lib/state-portal";
import { getStateNurseryContext } from "./state-nursery-helpers";

export const DEFAULT_ATHLETE_PAGE_SIZE = 100;

type AthleteRow = {
  id: string;
  fullName: string;
  externalId: string;
  avatarColor: string;
  rating: string | null;
  weightCategory: string | null;
  heightCategory: string | null;
  dateOfBirth: Date | null;
  status: string;
  scoutingStatus: string | null;
  joinedAt: Date | null;
  sportName: string;
  batchName: string | null;
  district: string | null;
  nurseryName: string;
  coachName: string | null;
};

function formatJoinedDate(value: Date | null): string {
  if (!value) return "—";
  return value.toLocaleDateString("en-IN");
}

function formatPlayerStatus(status: string): string {
  if (status === "on_hold") return "On hold";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function mapRowToListItem(row: AthleteRow): StateAthleteListItem {
  const weight = row.weightCategory ? formatWeightKg(row.weightCategory) : "";
  const sportLine = weight ? `${row.sportName} · ${weight}` : row.sportName;
  const batchPart = row.batchName ? ` · ${row.batchName}` : "";

  return {
    id: row.id,
    initials: getInitials(row.fullName),
    name: row.fullName,
    detail: `${row.externalId} · ${formatAge(row.dateOfBirth)}`,
    sport: `${sportLine}${batchPart}`,
    district: row.district ?? "—",
    rating: row.rating ?? "—",
    color: row.avatarColor,
  };
}

function mapRowToReportRow(row: AthleteRow): StateAthleteReportRow {
  return {
    playerId: row.externalId,
    name: row.fullName,
    age: formatAge(row.dateOfBirth),
    sport: row.sportName,
    weight: row.weightCategory ? formatWeightKg(row.weightCategory) : "—",
    height: row.heightCategory ? formatWeightKg(row.heightCategory) : "—",
    batch: row.batchName ?? "—",
    district: row.district ?? "—",
    nursery: row.nurseryName,
    score: row.rating ?? "—",
    playerStatus: formatPlayerStatus(row.status),
    scoutingStatus: row.scoutingStatus
      ? scoutingStatusLabel(row.scoutingStatus as ScoutingStatus)
      : "—",
    primaryCoach: row.coachName ?? "—",
    joined: formatJoinedDate(row.joinedAt),
  };
}

const athleteSelect = {
  id: players.id,
  fullName: players.fullName,
  externalId: players.externalId,
  avatarColor: players.avatarColor,
  rating: players.rating,
  weightCategory: players.weightCategory,
  heightCategory: players.heightCategory,
  dateOfBirth: players.dateOfBirth,
  status: players.status,
  scoutingStatus: players.scoutingStatus,
  joinedAt: players.joinedAt,
  sportName: sports.name,
  batchName: batches.name,
  district: academies.district,
  nurseryName: academies.name,
  coachName: coaches.fullName,
};

function athleteFromClause() {
  return db
    .select(athleteSelect)
    .from(players)
    .innerJoin(academies, eq(players.academyId, academies.id))
    .innerJoin(sports, eq(players.sportId, sports.id))
    .leftJoin(batches, eq(players.batchId, batches.id))
    .leftJoin(coaches, eq(players.primaryCoachId, coaches.id));
}

async function buildAthleteConditions(filters?: StateAthleteFilters) {
  const { academyIds } = await getStateNurseryContext();
  if (academyIds.length === 0) return null;

  const conditions = [
    inArray(players.academyId, academyIds),
    inArray(players.status, ["active", "on_hold"]),
    isNull(academies.deletedAt),
  ];

  if (filters?.district && filters.district !== "all") {
    conditions.push(eq(academies.district, filters.district));
  }

  if (filters?.sport && filters.sport !== "all") {
    conditions.push(eq(sports.name, filters.sport));
  }

  if (filters?.minRating != null) {
    conditions.push(gte(players.rating, filters.minRating.toFixed(1)));
  }

  const search = filters?.search?.trim();
  if (search) {
    const pattern = `%${search}%`;
    conditions.push(
      or(
        ilike(players.fullName, pattern),
        ilike(players.externalId, pattern),
        ilike(sports.name, pattern),
        ilike(academies.district, pattern),
        ilike(academies.name, pattern)
      )!
    );
  }

  return and(...conditions);
}

function athleteOrderBy() {
  return [desc(players.rating), asc(players.id)] as const;
}

export async function listStateAthletesPage(options: {
  filters?: StateAthleteFilters;
  offset?: number;
  limit?: number;
}): Promise<StateAthleteListResult> {
  const where = await buildAthleteConditions(options.filters);
  if (!where) return { items: [], total: 0 };

  const offset = options.offset ?? 0;
  const limit = options.limit ?? DEFAULT_ATHLETE_PAGE_SIZE;

  const [countRow, rows] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(players)
      .innerJoin(academies, eq(players.academyId, academies.id))
      .innerJoin(sports, eq(players.sportId, sports.id))
      .where(where),
    athleteFromClause().where(where).orderBy(...athleteOrderBy()).offset(offset).limit(limit),
  ]);

  return {
    items: rows.map(mapRowToListItem),
    total: Number(countRow[0]?.count ?? 0),
  };
}

export async function listStateAthleteReportRows(
  filters?: StateAthleteFilters
): Promise<StateAthleteReportRow[]> {
  const where = await buildAthleteConditions(filters);
  if (!where) return [];

  const rows = await athleteFromClause().where(where).orderBy(...athleteOrderBy());
  return rows.map(mapRowToReportRow);
}

export const listStateAthletes = cache(
  async (filters?: StateAthleteFilters): Promise<StateAthleteListItem[]> => {
    const { items } = await listStateAthletesPage({
      filters,
      offset: 0,
      limit: DEFAULT_ATHLETE_PAGE_SIZE,
    });
    return items;
  }
);

export async function listStateAthleteFilterOptions() {
  const athletes = await listStateAthletes();
  const districts = [...new Set(athletes.map((a) => a.district))].sort();
  const sportsList = [
    ...new Set(
      athletes.map((a) => {
        const idx = a.sport.indexOf(" · ");
        return idx === -1 ? a.sport.split(" · ")[0]! : a.sport.slice(0, idx);
      })
    ),
  ].sort();

  return { districts, sports: sportsList };
}
