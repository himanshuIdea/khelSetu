import { and, count, desc, eq, isNotNull, ne } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  batches,
  coachDrillPosts,
  coaches,
  drillReviews,
  drillSubmissions,
  mediaPostComments,
  mediaPostLikes,
  playerFollows,
  players,
  sports,
  users,
  type MediaFeedItemType,
} from "@/db/schema";
import { formatTimeAgo } from "@/lib/format";

const DEFAULT_THUMBNAIL = "linear-gradient(135deg, #0E1B33, #1E335C)";

export type FeedItemType = MediaFeedItemType;

export type AcademyFeedItem = {
  type: FeedItemType;
  sourceId: string;
  videoUrl: string;
  drillName: string;
  subtitle: string | null;
  authorName: string;
  authorKind: "player" | "coach";
  authorInitials: string;
  authorColor: string;
  sportId: string;
  sportName: string;
  batchName: string | null;
  publishedAt: string;
  timeAgo: string;
  thumbnailGradient: string;
  durationSeconds: number | null;
  rating: number | null;
  likeCount: number;
  commentCount: number;
  likedByViewer: boolean;
};

export type FeedComment = {
  id: string;
  body: string;
  authorName: string;
  authorInitials: string;
  createdAt: string;
  timeAgo: string;
};

export type FeedTopic = {
  name: string;
  count: number;
};

export type AcademyAthlete = {
  playerId: string;
  name: string;
  initials: string;
  avatarColor: string;
  sportName: string;
  publishedCount: number;
};

type RawFeedRow = {
  type: FeedItemType;
  sourceId: string;
  videoUrl: string;
  drillName: string;
  subtitle: string | null;
  authorName: string;
  authorKind: "player" | "coach";
  authorInitials: string;
  authorColor: string;
  sportId: string;
  sportName: string;
  batchName: string | null;
  publishedAt: Date;
  thumbnailGradient: string | null;
  durationSeconds: number | null;
  rating: number | null;
};

async function fetchPublishedRows(academyId: string): Promise<RawFeedRow[]> {
  const submissionRows = await db
    .select({
      sourceId: drillSubmissions.id,
      drillName: drillSubmissions.drillName,
      playerName: players.fullName,
      avatarColor: players.avatarColor,
      sportId: sports.id,
      sportName: sports.name,
      batchName: batches.name,
      videoUrl: drillSubmissions.videoUrl,
      thumbnailGradient: drillSubmissions.thumbnailGradient,
      durationSeconds: drillSubmissions.durationSeconds,
      publishedAt: drillSubmissions.publishedAt,
      reviewNotes: drillReviews.notes,
      reviewRating: drillReviews.rating,
    })
    .from(drillSubmissions)
    .innerJoin(players, eq(drillSubmissions.playerId, players.id))
    .innerJoin(sports, eq(players.sportId, sports.id))
    .leftJoin(batches, eq(players.batchId, batches.id))
    .leftJoin(drillReviews, eq(drillReviews.submissionId, drillSubmissions.id))
    .where(
      and(
        eq(drillSubmissions.academyId, academyId),
        isNotNull(drillSubmissions.publishedAt),
        ne(players.status, "inactive")
      )
    );

  const postRows = await db
    .select({
      sourceId: coachDrillPosts.id,
      drillName: coachDrillPosts.drillName,
      description: coachDrillPosts.description,
      coachName: coaches.fullName,
      coachColor: coaches.avatarColor,
      sportId: sports.id,
      sportName: sports.name,
      batchName: batches.name,
      videoUrl: coachDrillPosts.videoUrl,
      thumbnailGradient: coachDrillPosts.thumbnailGradient,
      durationSeconds: coachDrillPosts.durationSeconds,
      publishedAt: coachDrillPosts.publishedAt,
    })
    .from(coachDrillPosts)
    .innerJoin(coaches, eq(coachDrillPosts.coachId, coaches.id))
    .innerJoin(sports, eq(coachDrillPosts.sportId, sports.id))
    .leftJoin(batches, eq(coachDrillPosts.batchId, batches.id))
    .where(and(eq(coachDrillPosts.academyId, academyId), isNotNull(coachDrillPosts.publishedAt)));

  const submissionItems: RawFeedRow[] = submissionRows
    .filter((row) => row.videoUrl && row.publishedAt)
    .map((row) => ({
      type: "player_submission",
      sourceId: row.sourceId,
      videoUrl: row.videoUrl!,
      drillName: row.drillName,
      subtitle: row.reviewNotes,
      authorName: row.playerName,
      authorKind: "player",
      authorInitials: row.playerName
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      authorColor: row.avatarColor ?? "#7C5CFC",
      sportId: row.sportId,
      sportName: row.sportName,
      batchName: row.batchName,
      publishedAt: row.publishedAt!,
      thumbnailGradient: row.thumbnailGradient,
      durationSeconds: row.durationSeconds,
      rating: row.reviewRating,
    }));

  const postItems: RawFeedRow[] = postRows
    .filter((row) => row.publishedAt)
    .map((row) => ({
      type: "coach_post",
      sourceId: row.sourceId,
      videoUrl: row.videoUrl,
      drillName: row.drillName,
      subtitle: row.description,
      authorName: row.coachName,
      authorKind: "coach",
      authorInitials: row.coachName
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      authorColor: row.coachColor ?? "#FF6B2C",
      sportId: row.sportId,
      sportName: row.sportName,
      batchName: row.batchName,
      publishedAt: row.publishedAt!,
      thumbnailGradient: row.thumbnailGradient,
      durationSeconds: row.durationSeconds,
      rating: null,
    }));

  return [...submissionItems, ...postItems].sort(
    (a, b) => b.publishedAt.getTime() - a.publishedAt.getTime()
  );
}

async function attachEngagement(
  academyId: string,
  rows: RawFeedRow[],
  viewerUserId?: string | null
): Promise<AcademyFeedItem[]> {
  if (rows.length === 0) {
    return [];
  }

  const keys = rows.map((row) => ({ type: row.type, id: row.sourceId }));

  const likeCounts = await db
    .select({
      itemType: mediaPostLikes.itemType,
      itemId: mediaPostLikes.itemId,
      count: count(),
    })
    .from(mediaPostLikes)
    .where(eq(mediaPostLikes.academyId, academyId))
    .groupBy(mediaPostLikes.itemType, mediaPostLikes.itemId);

  const commentCounts = await db
    .select({
      itemType: mediaPostComments.itemType,
      itemId: mediaPostComments.itemId,
      count: count(),
    })
    .from(mediaPostComments)
    .where(eq(mediaPostComments.academyId, academyId))
    .groupBy(mediaPostComments.itemType, mediaPostComments.itemId);

  const likedByViewer =
    viewerUserId != null
      ? await db
          .select({
            itemType: mediaPostLikes.itemType,
            itemId: mediaPostLikes.itemId,
          })
          .from(mediaPostLikes)
          .where(
            and(eq(mediaPostLikes.academyId, academyId), eq(mediaPostLikes.userId, viewerUserId))
          )
      : [];

  const likeMap = new Map(
    likeCounts.map((row) => [`${row.itemType}:${row.itemId}`, Number(row.count)])
  );
  const commentMap = new Map(
    commentCounts.map((row) => [`${row.itemType}:${row.itemId}`, Number(row.count)])
  );
  const likedSet = new Set(likedByViewer.map((row) => `${row.itemType}:${row.itemId}`));

  return rows.map((row) => {
    const key = `${row.type}:${row.sourceId}`;
    return {
      type: row.type,
      sourceId: row.sourceId,
      videoUrl: row.videoUrl,
      drillName: row.drillName,
      subtitle: row.subtitle,
      authorName: row.authorName,
      authorKind: row.authorKind,
      authorInitials: row.authorInitials,
      authorColor: row.authorColor,
      sportId: row.sportId,
      sportName: row.sportName,
      batchName: row.batchName,
      publishedAt: row.publishedAt.toISOString(),
      timeAgo: formatTimeAgo(row.publishedAt),
      thumbnailGradient: row.thumbnailGradient ?? DEFAULT_THUMBNAIL,
      durationSeconds: row.durationSeconds,
      rating: row.rating,
      likeCount: likeMap.get(key) ?? 0,
      commentCount: commentMap.get(key) ?? 0,
      likedByViewer: likedSet.has(key),
    };
  });
}

export async function listAcademyFeed(
  academyId: string,
  options?: {
    sportId?: string | null;
    topic?: string | null;
    search?: string | null;
    viewerUserId?: string | null;
  }
): Promise<AcademyFeedItem[]> {
  let rows = await fetchPublishedRows(academyId);

  if (options?.sportId && options.sportId !== "all") {
    rows = rows.filter((row) => row.sportId === options.sportId);
  }

  if (options?.topic && options.topic !== "all") {
    const topic = options.topic.toLowerCase();
    rows = rows.filter((row) => row.drillName.toLowerCase().includes(topic));
  }

  if (options?.search?.trim()) {
    const q = options.search.trim().toLowerCase();
    rows = rows.filter(
      (row) =>
        row.drillName.toLowerCase().includes(q) ||
        row.authorName.toLowerCase().includes(q) ||
        row.sportName.toLowerCase().includes(q)
    );
  }

  return attachEngagement(academyId, rows, options?.viewerUserId);
}

export async function listFeedSports(academyId: string) {
  const rows = await fetchPublishedRows(academyId);
  const seen = new Map<string, string>();
  for (const row of rows) {
    if (!seen.has(row.sportId)) {
      seen.set(row.sportId, row.sportName);
    }
  }
  return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
}

export async function listFeedTopics(academyId: string, limit = 8): Promise<FeedTopic[]> {
  const rows = await fetchPublishedRows(academyId);
  const counts = new Map<string, number>();

  for (const row of rows) {
    counts.set(row.drillName, (counts.get(row.drillName) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export async function listAcademyAthletes(
  academyId: string,
  options?: { excludePlayerId?: string; sportId?: string | null }
): Promise<AcademyAthlete[]> {
  const publishedCounts = await db
    .select({
      playerId: drillSubmissions.playerId,
      count: count(),
    })
    .from(drillSubmissions)
    .where(
      and(eq(drillSubmissions.academyId, academyId), isNotNull(drillSubmissions.publishedAt))
    )
    .groupBy(drillSubmissions.playerId);

  const countMap = new Map(
    publishedCounts.map((row) => [row.playerId, Number(row.count)])
  );

  const playerRows = await db
    .select({
      id: players.id,
      fullName: players.fullName,
      avatarColor: players.avatarColor,
      sportName: sports.name,
      sportId: sports.id,
    })
    .from(players)
    .innerJoin(sports, eq(players.sportId, sports.id))
    .where(and(eq(players.academyId, academyId), ne(players.status, "inactive")));

  let athletes = playerRows
    .filter((row) => row.id !== options?.excludePlayerId)
    .map((row) => ({
      playerId: row.id,
      name: row.fullName,
      initials: row.fullName
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      avatarColor: row.avatarColor ?? "#7C5CFC",
      sportName: row.sportName,
      publishedCount: countMap.get(row.id) ?? 0,
    }));

  if (options?.sportId && options.sportId !== "all") {
    athletes = athletes.filter((row) => {
      const player = playerRows.find((p) => p.id === row.playerId);
      return player?.sportId === options.sportId;
    });
  }

  return athletes.sort((a, b) => b.publishedCount - a.publishedCount || a.name.localeCompare(b.name));
}

export async function toggleFeedLike(
  academyId: string,
  itemType: FeedItemType,
  itemId: string,
  userId: string
) {
  const existing = await db
    .select({ id: mediaPostLikes.id })
    .from(mediaPostLikes)
    .where(
      and(
        eq(mediaPostLikes.academyId, academyId),
        eq(mediaPostLikes.itemType, itemType),
        eq(mediaPostLikes.itemId, itemId),
        eq(mediaPostLikes.userId, userId)
      )
    )
    .limit(1);

  if (existing[0]) {
    await db.delete(mediaPostLikes).where(eq(mediaPostLikes.id, existing[0].id));
  } else {
    await db.insert(mediaPostLikes).values({
      academyId,
      itemType,
      itemId,
      userId,
    });
  }

  const [likeRow] = await db
    .select({ count: count() })
    .from(mediaPostLikes)
    .where(
      and(
        eq(mediaPostLikes.academyId, academyId),
        eq(mediaPostLikes.itemType, itemType),
        eq(mediaPostLikes.itemId, itemId)
      )
    );

  return {
    liked: !existing[0],
    likeCount: Number(likeRow?.count ?? 0),
  };
}

export async function listFeedComments(
  academyId: string,
  itemType: FeedItemType,
  itemId: string
): Promise<FeedComment[]> {
  const rows = await db
    .select({
      id: mediaPostComments.id,
      body: mediaPostComments.body,
      createdAt: mediaPostComments.createdAt,
      userName: users.fullName,
      userInitials: users.avatarInitials,
    })
    .from(mediaPostComments)
    .innerJoin(users, eq(mediaPostComments.userId, users.id))
    .where(
      and(
        eq(mediaPostComments.academyId, academyId),
        eq(mediaPostComments.itemType, itemType),
        eq(mediaPostComments.itemId, itemId)
      )
    )
    .orderBy(desc(mediaPostComments.createdAt));

  return rows.map((row) => ({
    id: row.id,
    body: row.body,
    authorName: row.userName,
    authorInitials: row.userInitials,
    createdAt: row.createdAt.toISOString(),
    timeAgo: formatTimeAgo(row.createdAt),
  }));
}

export async function addFeedComment(
  academyId: string,
  itemType: FeedItemType,
  itemId: string,
  userId: string,
  body: string
): Promise<FeedComment> {
  const trimmed = body.trim();
  if (!trimmed) {
    throw new Error("Comment cannot be empty.");
  }

  const [row] = await db
    .insert(mediaPostComments)
    .values({
      academyId,
      itemType,
      itemId,
      userId,
      body: trimmed,
    })
    .returning({
      id: mediaPostComments.id,
      body: mediaPostComments.body,
      createdAt: mediaPostComments.createdAt,
      userId: mediaPostComments.userId,
    });

  const [user] = await db
    .select({ fullName: users.fullName, avatarInitials: users.avatarInitials })
    .from(users)
    .where(eq(users.id, row.userId))
    .limit(1);

  return {
    id: row.id,
    body: row.body,
    authorName: user?.fullName ?? "User",
    authorInitials: user?.avatarInitials ?? "U",
    createdAt: row.createdAt.toISOString(),
    timeAgo: formatTimeAgo(row.createdAt),
  };
}

export async function setPlayerFollow(
  academyId: string,
  followerPlayerId: string,
  followedPlayerId: string,
  follow: boolean
) {
  if (followerPlayerId === followedPlayerId) {
    throw new Error("You cannot follow yourself.");
  }

  const [target] = await db
    .select({ id: players.id })
    .from(players)
    .where(and(eq(players.id, followedPlayerId), eq(players.academyId, academyId)))
    .limit(1);

  if (!target) {
    throw new Error("Player not found.");
  }

  if (follow) {
    await db
      .insert(playerFollows)
      .values({ academyId, followerPlayerId, followedPlayerId })
      .onConflictDoNothing();
  } else {
    await db
      .delete(playerFollows)
      .where(
        and(
          eq(playerFollows.academyId, academyId),
          eq(playerFollows.followerPlayerId, followerPlayerId),
          eq(playerFollows.followedPlayerId, followedPlayerId)
        )
      );
  }

  return { ok: true as const };
}
