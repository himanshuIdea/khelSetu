import { and, desc, eq, inArray, isNotNull, or } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  batchCoaches,
  batches,
  coachDrillPosts,
  coaches,
  drillReviews,
  drillSubmissions,
  players,
  sports,
  type DrillReviewCriteriaScores,
} from "@/db/schema";
import { formatTimeAgo } from "@/lib/format";

const DEFAULT_THUMBNAIL = "linear-gradient(135deg, #0E1B33, #1E335C)";

export type PlayerDrillDateFilter = "all" | "7d" | "30d";

export type PlayerDrillSubmissionStatus = "not_submitted" | "pending" | "reviewed";

export type PlayerDrillPost = {
  id: string;
  drillName: string;
  coachName: string;
  sportId: string;
  sportName: string;
  batchName: string;
  postedAt: string;
  timeAgo: string;
  thumbnailGradient: string;
  durationSeconds: number | null;
  submissionStatus: PlayerDrillSubmissionStatus;
};

export type PlayerDrillPostDetail = PlayerDrillPost & {
  description: string | null;
  videoUrl: string;
  review: {
    rating: number;
    notes: string | null;
    criteriaScores: DrillReviewCriteriaScores | null;
    reviewedAt: string;
  } | null;
};

export type PlayerDrillListContext = {
  hasBatch: boolean;
  batchName: string | null;
  coachName: string | null;
};

type PlayerVisibility = {
  batchId: string;
  primaryCoachId: string | null;
  batchCoachIds: string[];
};

export async function resolvePlayerVisibility(
  academyId: string,
  playerId: string
): Promise<(PlayerVisibility & { batchName: string | null; coachName: string | null }) | null> {
  const [playerRow] = await db
    .select({
      batchId: players.batchId,
      primaryCoachId: players.primaryCoachId,
      batchName: batches.name,
      coachName: coaches.fullName,
    })
    .from(players)
    .leftJoin(batches, eq(players.batchId, batches.id))
    .leftJoin(coaches, eq(players.primaryCoachId, coaches.id))
    .where(and(eq(players.academyId, academyId), eq(players.id, playerId)))
    .limit(1);

  if (!playerRow?.batchId) {
    return null;
  }

  const batchCoachRows = await db
    .select({ coachId: batchCoaches.coachId })
    .from(batchCoaches)
    .where(eq(batchCoaches.batchId, playerRow.batchId));

  return {
    batchId: playerRow.batchId,
    primaryCoachId: playerRow.primaryCoachId,
    batchCoachIds: batchCoachRows.map((row) => row.coachId),
    batchName: playerRow.batchName,
    coachName: playerRow.coachName,
  };
}

export function buildCoachVisibilityCondition(
  primaryCoachId: string | null,
  batchCoachIds: string[]
) {
  const parts = [];
  if (primaryCoachId) {
    parts.push(eq(coachDrillPosts.coachId, primaryCoachId));
  }
  if (batchCoachIds.length > 0) {
    parts.push(inArray(coachDrillPosts.coachId, batchCoachIds));
  }
  if (parts.length === 0) {
    return null;
  }
  return parts.length === 1 ? parts[0]! : or(...parts);
}

function mapSubmissionStatus(
  status: "pending" | "reviewed" | null | undefined
): PlayerDrillSubmissionStatus {
  if (status === "pending") return "pending";
  if (status === "reviewed") return "reviewed";
  return "not_submitted";
}

export async function getPlayerDrillListContext(
  academyId: string,
  playerId: string
): Promise<PlayerDrillListContext> {
  const visibility = await resolvePlayerVisibility(academyId, playerId);
  if (!visibility) {
    return { hasBatch: false, batchName: null, coachName: null };
  }
  return {
    hasBatch: true,
    batchName: visibility.batchName,
    coachName: visibility.coachName,
  };
}

export async function listPlayerAssignedDrills(
  academyId: string,
  playerId: string
): Promise<PlayerDrillPost[]> {
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

  const rows = await db
    .select({
      id: coachDrillPosts.id,
      drillName: coachDrillPosts.drillName,
      coachName: coaches.fullName,
      sportId: sports.id,
      sportName: sports.name,
      batchName: batches.name,
      postedAt: coachDrillPosts.postedAt,
      thumbnailGradient: coachDrillPosts.thumbnailGradient,
      durationSeconds: coachDrillPosts.durationSeconds,
      submissionStatus: drillSubmissions.status,
    })
    .from(coachDrillPosts)
    .innerJoin(coaches, eq(coachDrillPosts.coachId, coaches.id))
    .innerJoin(sports, eq(coachDrillPosts.sportId, sports.id))
    .innerJoin(batches, eq(coachDrillPosts.batchId, batches.id))
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
        coachCondition
      )
    )
    .orderBy(desc(coachDrillPosts.postedAt));

  return rows.map((row) => ({
    id: row.id,
    drillName: row.drillName,
    coachName: row.coachName,
    sportId: row.sportId,
    sportName: row.sportName,
    batchName: row.batchName ?? visibility.batchName ?? "Batch",
    postedAt: row.postedAt.toISOString(),
    timeAgo: formatTimeAgo(row.postedAt),
    thumbnailGradient: row.thumbnailGradient ?? DEFAULT_THUMBNAIL,
    durationSeconds: row.durationSeconds,
    submissionStatus: mapSubmissionStatus(row.submissionStatus),
  }));
}

export async function getPlayerAssignedDrillPost(
  academyId: string,
  playerId: string,
  postId: string
): Promise<PlayerDrillPostDetail | null> {
  const visibility = await resolvePlayerVisibility(academyId, playerId);
  if (!visibility) {
    return null;
  }

  const coachCondition = buildCoachVisibilityCondition(
    visibility.primaryCoachId,
    visibility.batchCoachIds
  );
  if (!coachCondition) {
    return null;
  }

  const [row] = await db
    .select({
      id: coachDrillPosts.id,
      drillName: coachDrillPosts.drillName,
      description: coachDrillPosts.description,
      videoUrl: coachDrillPosts.videoUrl,
      coachName: coaches.fullName,
      sportId: sports.id,
      sportName: sports.name,
      batchName: batches.name,
      postedAt: coachDrillPosts.postedAt,
      thumbnailGradient: coachDrillPosts.thumbnailGradient,
      durationSeconds: coachDrillPosts.durationSeconds,
      submissionStatus: drillSubmissions.status,
      reviewRating: drillReviews.rating,
      reviewNotes: drillReviews.notes,
      reviewCriteria: drillReviews.criteriaScores,
      reviewedAt: drillReviews.reviewedAt,
    })
    .from(coachDrillPosts)
    .innerJoin(coaches, eq(coachDrillPosts.coachId, coaches.id))
    .innerJoin(sports, eq(coachDrillPosts.sportId, sports.id))
    .innerJoin(batches, eq(coachDrillPosts.batchId, batches.id))
    .leftJoin(
      drillSubmissions,
      and(
        eq(drillSubmissions.drillPostId, coachDrillPosts.id),
        eq(drillSubmissions.playerId, playerId)
      )
    )
    .leftJoin(drillReviews, eq(drillReviews.submissionId, drillSubmissions.id))
    .where(
      and(
        eq(coachDrillPosts.id, postId),
        eq(coachDrillPosts.academyId, academyId),
        isNotNull(coachDrillPosts.batchId),
        eq(coachDrillPosts.batchId, visibility.batchId),
        coachCondition
      )
    )
    .limit(1);

  if (!row) {
    return null;
  }

  const submissionStatus = mapSubmissionStatus(row.submissionStatus);

  return {
    id: row.id,
    drillName: row.drillName,
    description: row.description,
    videoUrl: row.videoUrl,
    coachName: row.coachName,
    sportId: row.sportId,
    sportName: row.sportName,
    batchName: row.batchName ?? visibility.batchName ?? "Batch",
    postedAt: row.postedAt.toISOString(),
    timeAgo: formatTimeAgo(row.postedAt),
    thumbnailGradient: row.thumbnailGradient ?? DEFAULT_THUMBNAIL,
    durationSeconds: row.durationSeconds,
    submissionStatus,
    review:
      submissionStatus === "reviewed" && row.reviewRating != null
        ? {
            rating: row.reviewRating,
            notes: row.reviewNotes,
            criteriaScores: row.reviewCriteria,
            reviewedAt: row.reviewedAt!.toISOString(),
          }
        : null,
  };
}
