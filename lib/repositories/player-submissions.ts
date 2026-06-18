import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { coachDrillPosts, drillSubmissions, players } from "@/db/schema";

export type CreatePlayerSubmissionInput = {
  academyId: string;
  playerId: string;
  drillName: string;
  videoUrl: string;
  drillPostId?: string | null;
  thumbnailGradient?: string | null;
  durationSeconds?: number | null;
};

export async function createPlayerSubmission(input: CreatePlayerSubmissionInput) {
  const [player] = await db
    .select({
      id: players.id,
      coachId: players.primaryCoachId,
    })
    .from(players)
    .where(and(eq(players.id, input.playerId), eq(players.academyId, input.academyId)))
    .limit(1);

  if (!player) {
    throw new Error("Player not found.");
  }

  if (!player.coachId) {
    throw new Error("No coach assigned. Ask your academy admin to assign a coach.");
  }

  if (input.drillPostId) {
    const [post] = await db
      .select({ id: coachDrillPosts.id })
      .from(coachDrillPosts)
      .where(
        and(
          eq(coachDrillPosts.id, input.drillPostId),
          eq(coachDrillPosts.academyId, input.academyId)
        )
      )
      .limit(1);

    if (!post) {
      throw new Error("Drill reference not found.");
    }
  }

  const [row] = await db
    .insert(drillSubmissions)
    .values({
      academyId: input.academyId,
      playerId: input.playerId,
      coachId: player.coachId,
      drillPostId: input.drillPostId ?? null,
      drillName: input.drillName.trim(),
      videoUrl: input.videoUrl.trim(),
      thumbnailGradient: input.thumbnailGradient ?? null,
      durationSeconds: input.durationSeconds ?? null,
      status: "pending",
    })
    .returning({
      id: drillSubmissions.id,
      drillName: drillSubmissions.drillName,
      submittedAt: drillSubmissions.submittedAt,
    });

  return row;
}
