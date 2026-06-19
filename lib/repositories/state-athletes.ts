import { cache } from "react";
import { and, desc, eq, gte, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { academies, batches, players, sports } from "@/db/schema";
import { formatAge, formatWeightKg, getInitials } from "@/lib/format";
import type { StateAthleteFilters, StateAthleteListItem } from "@/lib/state-portal";
import { getStateNurseryContext } from "./state-nursery-helpers";

const DEFAULT_LIMIT = 100;

export const listStateAthletes = cache(
  async (filters?: StateAthleteFilters): Promise<StateAthleteListItem[]> => {
    const { academyIds } = await getStateNurseryContext();
    if (academyIds.length === 0) return [];

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
      conditions.push(gte(players.rating, String(filters.minRating)));
    }

    const rows = await db
      .select({
        id: players.id,
        fullName: players.fullName,
        externalId: players.externalId,
        avatarColor: players.avatarColor,
        rating: players.rating,
        weightCategory: players.weightCategory,
        dateOfBirth: players.dateOfBirth,
        sportName: sports.name,
        batchName: batches.name,
        district: academies.district,
      })
      .from(players)
      .innerJoin(academies, eq(players.academyId, academies.id))
      .innerJoin(sports, eq(players.sportId, sports.id))
      .leftJoin(batches, eq(players.batchId, batches.id))
      .where(and(...conditions))
      .orderBy(desc(players.rating))
      .limit(DEFAULT_LIMIT);

    return rows.map((row) => {
      const weight = row.weightCategory ? formatWeightKg(row.weightCategory) : "";
      const sportLine = weight ? `${row.sportName} · ${weight}` : row.sportName;
      const batchPart = row.batchName ? ` · ${row.batchName}` : "";

      return {
        id: row.id,
        initials: getInitials(row.fullName),
        name: row.fullName,
        detail: `${row.externalId} · ${formatAge(row.dateOfBirth)}`,
        sport: `${sportLine}${batchPart}`,
        district: row.district,
        rating: row.rating ?? "—",
        color: row.avatarColor,
      };
    });
  }
);

export async function listStateAthleteFilterOptions() {
  const athletes = await listStateAthletes();
  const districts = [...new Set(athletes.map((a) => a.district))].sort();
  const sports = [
    ...new Set(
      athletes.map((a) => {
        const idx = a.sport.indexOf(" · ");
        return idx === -1 ? a.sport.split(" · ")[0]! : a.sport.slice(0, idx);
      })
    ),
  ].sort();

  return { districts, sports };
}
