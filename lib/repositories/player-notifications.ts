import { and, desc, eq, gte, isNotNull, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  coachDrillPosts,
  coaches,
  drillReviews,
  drillSubmissions,
} from "@/db/schema";
import { formatTimeAgo } from "@/lib/format";
import type { PlayerNotification } from "@/lib/player-notifications-types";
import { playerDrillDetailRoute } from "@/lib/player-nav";
import {
  buildCoachVisibilityCondition,
  resolvePlayerVisibility,
} from "@/lib/repositories/player-drills";

export type { PlayerNotification } from "@/lib/player-notifications-types";

const NOTIFICATION_WINDOW_DAYS = 14;
const MAX_NOTIFICATIONS = 20;

function notificationWindowStart(): Date {
  const start = new Date();
  start.setDate(start.getDate() - NOTIFICATION_WINDOW_DAYS);
  return start;
}

export async function listPlayerNotifications(
  academyId: string,
  playerId: string
): Promise<PlayerNotification[]> {
  const visibility = await resolvePlayerVisibility(academyId, playerId);
  if (!visibility) {
    return [];
  }

  const coachCondition = buildCoachVisibilityCondition(
    visibility.primaryCoachId,
    visibility.batchCoachIds
  );
  if (!coachCondition) {
    return [];
  }

  const since = notificationWindowStart();

  const [drillRows, reviewRows] = await Promise.all([
    db
      .select({
        id: coachDrillPosts.id,
        drillName: coachDrillPosts.drillName,
        coachName: coaches.fullName,
        postedAt: coachDrillPosts.postedAt,
      })
      .from(coachDrillPosts)
      .innerJoin(coaches, eq(coachDrillPosts.coachId, coaches.id))
      .leftJoin(
        drillSubmissions,
        and(
          eq(drillSubmissions.drillPostId, coachDrillPosts.id),
          eq(drillSubmissions.playerId, playerId)
        )
      )
      .where(
        and(
          eq(coachDrillPosts.academyId, academyId),
          isNotNull(coachDrillPosts.batchId),
          eq(coachDrillPosts.batchId, visibility.batchId),
          coachCondition,
          gte(coachDrillPosts.postedAt, since),
          isNull(drillSubmissions.id)
        )
      )
      .orderBy(desc(coachDrillPosts.postedAt))
      .limit(MAX_NOTIFICATIONS),
    db
      .select({
        drillPostId: drillSubmissions.drillPostId,
        drillName: drillSubmissions.drillName,
        coachName: coaches.fullName,
        rating: drillReviews.rating,
        reviewedAt: drillReviews.reviewedAt,
      })
      .from(drillReviews)
      .innerJoin(drillSubmissions, eq(drillReviews.submissionId, drillSubmissions.id))
      .innerJoin(coaches, eq(drillSubmissions.coachId, coaches.id))
      .where(
        and(
          eq(drillSubmissions.playerId, playerId),
          eq(drillSubmissions.academyId, academyId),
          isNotNull(drillSubmissions.drillPostId),
          isNotNull(drillReviews.rating),
          gte(drillReviews.reviewedAt, since)
        )
      )
      .orderBy(desc(drillReviews.reviewedAt))
      .limit(MAX_NOTIFICATIONS),
  ]);

  const drillNotifications: PlayerNotification[] = drillRows.map((row) => {
    const at = row.postedAt.toISOString();
    return {
      kind: "new_drill",
      id: `drill:${row.id}`,
      drillPostId: row.id,
      title: "New drill posted",
      subtitle: `${row.drillName} · ${row.coachName}`,
      at,
      timeAgo: formatTimeAgo(row.postedAt),
      href: playerDrillDetailRoute(row.id),
    };
  });

  const reviewNotifications: PlayerNotification[] = reviewRows
    .filter(
      (row): row is typeof row & { drillPostId: string; rating: number; reviewedAt: Date } =>
        row.drillPostId != null && row.rating != null && row.reviewedAt != null
    )
    .map((row) => {
      const at = row.reviewedAt.toISOString();
      return {
        kind: "review",
        id: `review:${row.drillPostId}:${at}`,
        drillPostId: row.drillPostId,
        title: "Coach reviewed your submission",
        subtitle: `${row.drillName} · ${row.coachName} · ${row.rating}/10`,
        rating: row.rating,
        at,
        timeAgo: formatTimeAgo(row.reviewedAt),
        href: playerDrillDetailRoute(row.drillPostId),
      };
    });

  return [...drillNotifications, ...reviewNotifications]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, MAX_NOTIFICATIONS);
}
