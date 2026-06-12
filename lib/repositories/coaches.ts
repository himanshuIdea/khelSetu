import { and, eq, inArray, isNotNull, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { academySports, coaches, drillSubmissions, players, sports } from "@/db/schema";
import type { CoachFormOptions, CreateCoachPayload } from "@/lib/coaches";
import { formatTimeAgo, getInitials, nisLevelLabel } from "@/lib/format";
import type { Coach, PendingReview } from "./types";

async function getActivePlayerCountsByCoach(academyId: string) {
  const rows = await db
    .select({
      coachId: players.primaryCoachId,
      count: sql<number>`count(*)`,
    })
    .from(players)
    .where(
      and(
        eq(players.academyId, academyId),
        isNotNull(players.primaryCoachId),
        inArray(players.status, ["active", "on_hold"])
      )
    )
    .groupBy(players.primaryCoachId);

  return new Map(rows.map((row) => [row.coachId!, Number(row.count)]));
}

export async function getCoaches(academyId: string): Promise<Coach[]> {
  const playerCountsByCoach = await getActivePlayerCountsByCoach(academyId);

  const rows = await db
    .select({
      coach: coaches,
      sportName: sports.name,
      pendingCount: sql<number>`(
        select count(*) from ${drillSubmissions}
        inner join ${players} on ${players.id} = ${drillSubmissions.playerId}
        where ${drillSubmissions.coachId} = ${coaches.id}
          and ${drillSubmissions.status} = 'pending'
          and ${players.status} <> 'inactive'
      )`,
    })
    .from(coaches)
    .innerJoin(sports, eq(coaches.sportId, sports.id))
    .where(eq(coaches.academyId, academyId));

  return rows.map((row) => {
    const nis = nisLevelLabel(row.coach.nisLevel);
    return {
      id: row.coach.id,
      initials: getInitials(row.coach.fullName),
      name: row.coach.fullName,
      role: row.coach.roleTitle,
      badge: nis.badge,
      badgeLabel: nis.label,
      avatarColor: row.coach.avatarColor,
      players: playerCountsByCoach.get(row.coach.id) ?? 0,
      rating: Number(row.coach.rating),
      drillsPerWeek: row.coach.drillsPerWeek,
      toReview: Number(row.pendingCount),
    };
  });
}

export async function getPendingReviews(academyId: string): Promise<PendingReview[]> {
  const rows = await db
    .select({
      drillName: drillSubmissions.drillName,
      playerName: players.fullName,
      submittedAt: drillSubmissions.submittedAt,
      thumbnailGradient: drillSubmissions.thumbnailGradient,
    })
    .from(drillSubmissions)
    .innerJoin(players, eq(drillSubmissions.playerId, players.id))
    .where(
      and(
        eq(drillSubmissions.academyId, academyId),
        eq(drillSubmissions.status, "pending"),
        ne(players.status, "inactive")
      )
    )
    .orderBy(sql`${drillSubmissions.submittedAt} desc`)
    .limit(5);

  return rows.map((row) => ({
    drill: row.drillName,
    player: row.playerName,
    timeAgo: formatTimeAgo(row.submittedAt),
    thumbnailGradient: row.thumbnailGradient ?? "linear-gradient(135deg, #0E1B33, #1E335C)",
  }));
}

export async function getCoachCount(academyId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(coaches)
    .where(eq(coaches.academyId, academyId));

  return Number(row?.count ?? 0);
}

export async function getCoachFormOptions(academyId: string): Promise<CoachFormOptions> {
  const sportRows = await db
    .select({ id: sports.id, name: sports.name, color: sports.color })
    .from(academySports)
    .innerJoin(sports, eq(academySports.sportId, sports.id))
    .where(eq(academySports.academyId, academyId));

  return { sports: sportRows };
}

export async function createCoach(academyId: string, payload: CreateCoachPayload) {
  const [sport] = await db
    .select({ id: sports.id, name: sports.name, color: sports.color })
    .from(sports)
    .innerJoin(academySports, eq(academySports.sportId, sports.id))
    .where(and(eq(academySports.academyId, academyId), eq(sports.id, payload.sportId)))
    .limit(1);

  if (!sport) {
    throw new Error("Selected sport is not offered by this academy.");
  }

  const roleTitle = payload.roleTitle?.trim() || `${sport.name} · Coach`;

  const [coach] = await db
    .insert(coaches)
    .values({
      academyId,
      fullName: payload.fullName.trim(),
      sportId: payload.sportId,
      roleTitle,
      nisLevel: payload.nisLevel ?? "in_review",
      avatarColor: sport.color,
    })
    .returning({ id: coaches.id });

  return coach;
}
