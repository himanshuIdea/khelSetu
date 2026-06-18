import { and, desc, eq, isNotNull, ne } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  batches,
  coachDrillPosts,
  coaches,
  drillReviews,
  drillSubmissions,
  players,
  sports,
  type DrillReviewCriteriaScores,
  type MediaFeedItemType,
} from "@/db/schema";
import { formatTimeAgo } from "@/lib/format";

export type CoachMediaTab = "to-review" | "academy-media" | "reviewed";

export type CoachMediaSubmission = {
  id: string;
  drillName: string;
  playerName: string;
  playerId: string;
  sportId: string;
  sportName: string;
  batchId: string | null;
  batchName: string | null;
  status: "pending" | "reviewed";
  submittedAt: string;
  timeAgo: string;
  thumbnailGradient: string;
  videoUrl: string | null;
  durationSeconds: number | null;
  publishedAt: string | null;
  isPublished: boolean;
};

export type CoachSubmissionDetail = CoachMediaSubmission & {
  review: {
    rating: number;
    notes: string | null;
    criteriaScores: DrillReviewCriteriaScores | null;
    reviewedAt: string;
  } | null;
};

export type AcademyPublishedMediaItem = {
  type: MediaFeedItemType;
  sourceId: string;
  drillName: string;
  subtitle: string | null;
  authorName: string;
  authorKind: "player" | "coach";
  sportId: string;
  sportName: string;
  batchId: string | null;
  batchName: string | null;
  playerId: string | null;
  videoUrl: string;
  thumbnailGradient: string;
  durationSeconds: number | null;
  publishedAt: string;
  timeAgo: string;
  rating: number | null;
};

export type CoachMediaFilterOptions = {
  sports: { id: string; name: string }[];
  batches: { id: string; name: string; sportId: string }[];
};

export type CoachDrillPostItem = {
  id: string;
  drillName: string;
  description: string | null;
  sportId: string;
  sportName: string;
  batchId: string | null;
  batchName: string | null;
  postedAt: string;
  timeAgo: string;
  thumbnailGradient: string;
  videoUrl: string;
  durationSeconds: number | null;
  publishedAt: string | null;
  isPublished: boolean;
};

export type CreateCoachDrillPostInput = {
  academyId: string;
  coachId: string;
  sportId: string;
  batchId?: string | null;
  drillName: string;
  description?: string | null;
  videoUrl: string;
  thumbnailGradient?: string | null;
  durationSeconds?: number | null;
  publishToAcademy?: boolean;
};

export type SubmitDrillReviewInput = {
  rating: number;
  notes?: string | null;
  criteriaScores?: DrillReviewCriteriaScores | null;
  publishToAcademy?: boolean;
};

const DEFAULT_THUMBNAIL = "linear-gradient(135deg, #0E1B33, #1E335C)";

function mapSubmissionRow(row: {
  id: string;
  drillName: string;
  playerName: string;
  playerId: string;
  sportId: string;
  sportName: string;
  batchId: string | null;
  batchName: string | null;
  status: "pending" | "reviewed";
  submittedAt: Date;
  thumbnailGradient: string | null;
  videoUrl: string | null;
  durationSeconds: number | null;
  publishedAt: Date | null;
}): CoachMediaSubmission {
  return {
    id: row.id,
    drillName: row.drillName,
    playerName: row.playerName,
    playerId: row.playerId,
    sportId: row.sportId,
    sportName: row.sportName,
    batchId: row.batchId,
    batchName: row.batchName,
    status: row.status,
    submittedAt: row.submittedAt.toISOString(),
    timeAgo: formatTimeAgo(row.submittedAt),
    thumbnailGradient: row.thumbnailGradient ?? DEFAULT_THUMBNAIL,
    videoUrl: row.videoUrl,
    durationSeconds: row.durationSeconds,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    isPublished: row.publishedAt != null,
  };
}

export async function listCoachMediaFilterOptions(
  assignments: { sportId: string; sportName: string; batches: { id: string; name: string }[] }[]
): Promise<CoachMediaFilterOptions> {
  const sportsList = assignments.map((group) => ({
    id: group.sportId,
    name: group.sportName,
  }));

  const batchesList = assignments.flatMap((group) =>
    group.batches.map((batch) => ({
      id: batch.id,
      name: batch.name,
      sportId: group.sportId,
    }))
  );

  return { sports: sportsList, batches: batchesList };
}

export async function listCoachDrillPosts(
  academyId: string,
  coachId: string
): Promise<CoachDrillPostItem[]> {
  const rows = await db
    .select({
      id: coachDrillPosts.id,
      drillName: coachDrillPosts.drillName,
      description: coachDrillPosts.description,
      sportId: sports.id,
      sportName: sports.name,
      batchId: batches.id,
      batchName: batches.name,
      postedAt: coachDrillPosts.postedAt,
      thumbnailGradient: coachDrillPosts.thumbnailGradient,
      videoUrl: coachDrillPosts.videoUrl,
      durationSeconds: coachDrillPosts.durationSeconds,
      publishedAt: coachDrillPosts.publishedAt,
    })
    .from(coachDrillPosts)
    .innerJoin(sports, eq(coachDrillPosts.sportId, sports.id))
    .leftJoin(batches, eq(coachDrillPosts.batchId, batches.id))
    .where(and(eq(coachDrillPosts.academyId, academyId), eq(coachDrillPosts.coachId, coachId)))
    .orderBy(desc(coachDrillPosts.postedAt));

  return rows.map((row) => ({
    id: row.id,
    drillName: row.drillName,
    description: row.description,
    sportId: row.sportId,
    sportName: row.sportName,
    batchId: row.batchId,
    batchName: row.batchName,
    postedAt: row.postedAt.toISOString(),
    timeAgo: formatTimeAgo(row.postedAt),
    thumbnailGradient: row.thumbnailGradient ?? DEFAULT_THUMBNAIL,
    videoUrl: row.videoUrl,
    durationSeconds: row.durationSeconds,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    isPublished: row.publishedAt != null,
  }));
}

export async function listCoachSubmissions(
  academyId: string,
  coachId: string
): Promise<CoachMediaSubmission[]> {
  const rows = await db
    .select({
      id: drillSubmissions.id,
      drillName: drillSubmissions.drillName,
      playerName: players.fullName,
      playerId: players.id,
      sportId: sports.id,
      sportName: sports.name,
      batchId: batches.id,
      batchName: batches.name,
      status: drillSubmissions.status,
      submittedAt: drillSubmissions.submittedAt,
      thumbnailGradient: drillSubmissions.thumbnailGradient,
      videoUrl: drillSubmissions.videoUrl,
      durationSeconds: drillSubmissions.durationSeconds,
      publishedAt: drillSubmissions.publishedAt,
    })
    .from(drillSubmissions)
    .innerJoin(players, eq(drillSubmissions.playerId, players.id))
    .innerJoin(sports, eq(players.sportId, sports.id))
    .leftJoin(batches, eq(players.batchId, batches.id))
    .where(
      and(
        eq(drillSubmissions.academyId, academyId),
        eq(drillSubmissions.coachId, coachId),
        ne(players.status, "inactive")
      )
    )
    .orderBy(desc(drillSubmissions.submittedAt));

  return rows.map(mapSubmissionRow);
}

export async function getCoachSubmissionDetail(
  submissionId: string,
  coachId: string
): Promise<CoachSubmissionDetail | null> {
  const [row] = await db
    .select({
      id: drillSubmissions.id,
      drillName: drillSubmissions.drillName,
      playerName: players.fullName,
      playerId: players.id,
      sportId: sports.id,
      sportName: sports.name,
      batchId: batches.id,
      batchName: batches.name,
      status: drillSubmissions.status,
      submittedAt: drillSubmissions.submittedAt,
      thumbnailGradient: drillSubmissions.thumbnailGradient,
      videoUrl: drillSubmissions.videoUrl,
      durationSeconds: drillSubmissions.durationSeconds,
      publishedAt: drillSubmissions.publishedAt,
      reviewRating: drillReviews.rating,
      reviewNotes: drillReviews.notes,
      reviewCriteria: drillReviews.criteriaScores,
      reviewedAt: drillReviews.reviewedAt,
    })
    .from(drillSubmissions)
    .innerJoin(players, eq(drillSubmissions.playerId, players.id))
    .innerJoin(sports, eq(players.sportId, sports.id))
    .leftJoin(batches, eq(players.batchId, batches.id))
    .leftJoin(drillReviews, eq(drillReviews.submissionId, drillSubmissions.id))
    .where(and(eq(drillSubmissions.id, submissionId), eq(drillSubmissions.coachId, coachId)))
    .limit(1);

  if (!row) {
    return null;
  }

  const base = mapSubmissionRow(row);

  return {
    ...base,
    review:
      row.reviewRating != null
        ? {
            rating: row.reviewRating,
            notes: row.reviewNotes,
            criteriaScores: row.reviewCriteria,
            reviewedAt: row.reviewedAt!.toISOString(),
          }
        : null,
  };
}

export async function listAcademyPublishedMedia(academyId: string): Promise<AcademyPublishedMediaItem[]> {
  const submissionRows = await db
    .select({
      id: drillSubmissions.id,
      drillName: drillSubmissions.drillName,
      playerName: players.fullName,
      playerId: players.id,
      sportId: sports.id,
      sportName: sports.name,
      batchId: batches.id,
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
      id: coachDrillPosts.id,
      drillName: coachDrillPosts.drillName,
      description: coachDrillPosts.description,
      coachName: coaches.fullName,
      sportId: sports.id,
      sportName: sports.name,
      batchId: batches.id,
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

  const items: AcademyPublishedMediaItem[] = [
    ...submissionRows
      .filter((row) => row.videoUrl && row.publishedAt)
      .map((row) => ({
        type: "player_submission" as const,
        sourceId: row.id,
        drillName: row.drillName,
        subtitle: row.reviewNotes,
        authorName: row.playerName,
        authorKind: "player" as const,
        sportId: row.sportId,
        sportName: row.sportName,
        batchId: row.batchId,
        batchName: row.batchName,
        playerId: row.playerId,
        videoUrl: row.videoUrl!,
        thumbnailGradient: row.thumbnailGradient ?? DEFAULT_THUMBNAIL,
        durationSeconds: row.durationSeconds,
        publishedAt: row.publishedAt!.toISOString(),
        timeAgo: formatTimeAgo(row.publishedAt!),
        rating: row.reviewRating,
      })),
    ...postRows
      .filter((row) => row.publishedAt)
      .map((row) => ({
        type: "coach_post" as const,
        sourceId: row.id,
        drillName: row.drillName,
        subtitle: row.description,
        authorName: row.coachName,
        authorKind: "coach" as const,
        sportId: row.sportId,
        sportName: row.sportName,
        batchId: row.batchId,
        batchName: row.batchName,
        playerId: null,
        videoUrl: row.videoUrl,
        thumbnailGradient: row.thumbnailGradient ?? DEFAULT_THUMBNAIL,
        durationSeconds: row.durationSeconds,
        publishedAt: row.publishedAt!.toISOString(),
        timeAgo: formatTimeAgo(row.publishedAt!),
        rating: null,
      })),
  ];

  return items.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export async function createCoachDrillPost(input: CreateCoachDrillPostInput) {
  const now = input.publishToAcademy ? new Date() : null;

  const [row] = await db
    .insert(coachDrillPosts)
    .values({
      academyId: input.academyId,
      coachId: input.coachId,
      sportId: input.sportId,
      batchId: input.batchId ?? null,
      drillName: input.drillName,
      description: input.description ?? null,
      videoUrl: input.videoUrl,
      thumbnailGradient: input.thumbnailGradient ?? DEFAULT_THUMBNAIL,
      durationSeconds: input.durationSeconds ?? null,
      publishedAt: now,
      publishedByCoachId: now ? input.coachId : null,
    })
    .returning({
      id: coachDrillPosts.id,
      drillName: coachDrillPosts.drillName,
      postedAt: coachDrillPosts.postedAt,
      publishedAt: coachDrillPosts.publishedAt,
    });

  return row;
}

export async function setCoachPostPublished(
  postId: string,
  academyId: string,
  coachId: string,
  published: boolean
) {
  const [post] = await db
    .select({ id: coachDrillPosts.id })
    .from(coachDrillPosts)
    .where(and(eq(coachDrillPosts.id, postId), eq(coachDrillPosts.academyId, academyId)))
    .limit(1);

  if (!post) {
    throw new Error("Drill post not found.");
  }

  await db
    .update(coachDrillPosts)
    .set({
      publishedAt: published ? new Date() : null,
      publishedByCoachId: published ? coachId : null,
      updatedAt: new Date(),
    })
    .where(eq(coachDrillPosts.id, postId));

  return { ok: true as const };
}

export async function setSubmissionPublished(
  submissionId: string,
  academyId: string,
  coachId: string,
  published: boolean
) {
  const [submission] = await db
    .select({ id: drillSubmissions.id, status: drillSubmissions.status })
    .from(drillSubmissions)
    .where(and(eq(drillSubmissions.id, submissionId), eq(drillSubmissions.academyId, academyId)))
    .limit(1);

  if (!submission) {
    throw new Error("Submission not found.");
  }

  if (published && submission.status !== "reviewed") {
    throw new Error("Submission must be reviewed before publishing.");
  }

  await db
    .update(drillSubmissions)
    .set({
      publishedAt: published ? new Date() : null,
      publishedByCoachId: published ? coachId : null,
      updatedAt: new Date(),
    })
    .where(eq(drillSubmissions.id, submissionId));

  return { ok: true as const };
}

export async function submitDrillReview(
  submissionId: string,
  coachId: string,
  input: SubmitDrillReviewInput
) {
  const [submission] = await db
    .select({
      id: drillSubmissions.id,
      status: drillSubmissions.status,
    })
    .from(drillSubmissions)
    .where(and(eq(drillSubmissions.id, submissionId), eq(drillSubmissions.coachId, coachId)))
    .limit(1);

  if (!submission) {
    throw new Error("Submission not found.");
  }

  if (submission.status === "reviewed") {
    throw new Error("This submission has already been reviewed.");
  }

  const rating = Math.min(10, Math.max(1, Math.round(input.rating)));
  const publishNow = Boolean(input.publishToAcademy);

  await db.transaction(async (tx) => {
    await tx.insert(drillReviews).values({
      submissionId,
      reviewerCoachId: coachId,
      rating,
      notes: input.notes ?? null,
      criteriaScores: input.criteriaScores ?? null,
    });

    await tx
      .update(drillSubmissions)
      .set({
        status: "reviewed",
        publishedAt: publishNow ? new Date() : null,
        publishedByCoachId: publishNow ? coachId : null,
        updatedAt: new Date(),
      })
      .where(eq(drillSubmissions.id, submissionId));
  });

  return { ok: true as const };
}

export async function countCoachPendingReviews(academyId: string, coachId: string): Promise<number> {
  const rows = await listCoachSubmissions(academyId, coachId);
  return rows.filter((row) => row.status === "pending").length;
}
