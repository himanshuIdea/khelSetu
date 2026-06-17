import { and, desc, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  batches,
  coachDrillPosts,
  drillReviews,
  drillSubmissions,
  players,
  sports,
  type DrillReviewCriteriaScores,
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
};

export type CoachSubmissionDetail = CoachMediaSubmission & {
  review: {
    rating: number;
    notes: string | null;
    criteriaScores: DrillReviewCriteriaScores | null;
    reviewedAt: string;
  } | null;
};

export type CoachMediaFilterOptions = {
  sports: { id: string; name: string }[];
  batches: { id: string; name: string; sportId: string }[];
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
};

export type SubmitDrillReviewInput = {
  rating: number;
  notes?: string | null;
  criteriaScores?: DrillReviewCriteriaScores | null;
};

const DEFAULT_THUMBNAIL = "linear-gradient(135deg, #0E1B33, #1E335C)";

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

  return rows.map((row) => ({
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
  }));
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

export async function createCoachDrillPost(input: CreateCoachDrillPostInput) {
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
    })
    .returning({
      id: coachDrillPosts.id,
      drillName: coachDrillPosts.drillName,
      postedAt: coachDrillPosts.postedAt,
    });

  return row;
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
      .set({ status: "reviewed", updatedAt: new Date() })
      .where(eq(drillSubmissions.id, submissionId));
  });

  return { ok: true as const };
}

export async function countCoachPendingReviews(academyId: string, coachId: string): Promise<number> {
  const rows = await listCoachSubmissions(academyId, coachId);
  return rows.filter((row) => row.status === "pending").length;
}
