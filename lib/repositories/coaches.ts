import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { coaches, drillSubmissions, players, sports } from "@/db/schema";
import { formatTimeAgo, getInitials, nisLevelLabel } from "@/lib/format";
import type { Coach, PendingReview } from "./types";

export async function getCoaches(academyId: string): Promise<Coach[]> {
  const rows = await db
    .select({
      coach: coaches,
      sportName: sports.name,
      playerCount: sql<number>`(
        select count(*) from ${players}
        where ${players.sportId} = ${coaches.sportId}
        and ${players.academyId} = ${coaches.academyId}
      )`,
      pendingCount: sql<number>`(
        select count(*) from ${drillSubmissions}
        where ${drillSubmissions.coachId} = ${coaches.id}
        and ${drillSubmissions.status} = 'pending'
      )`,
    })
    .from(coaches)
    .innerJoin(sports, eq(coaches.sportId, sports.id))
    .where(eq(coaches.academyId, academyId));

  return rows.map((row) => {
    const nis = nisLevelLabel(row.coach.nisLevel);
    return {
      initials: getInitials(row.coach.fullName),
      name: row.coach.fullName,
      role: row.coach.roleTitle,
      badge: nis.badge,
      badgeLabel: nis.label,
      avatarColor: row.coach.avatarColor,
      players: Number(row.playerCount),
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
    .where(and(eq(drillSubmissions.academyId, academyId), eq(drillSubmissions.status, "pending")))
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
