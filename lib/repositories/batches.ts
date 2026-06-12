import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  academySports,
  batchCoaches,
  batchEnrollments,
  batches,
  feePlanTemplates,
  playerCoachAssignments,
  players,
  sports,
  trainingSessions,
} from "@/db/schema";
import { ACADEMY_BATCH_NAMES, sortBatchesByName } from "@/lib/batches";

type BatchRow = {
  id: string;
  academyId: string;
  sportId: string;
  name: string;
  createdAt: Date;
};

async function reassignBatchReferences(fromBatchId: string, toBatchId: string) {
  await db
    .update(players)
    .set({ batchId: toBatchId, updatedAt: new Date() })
    .where(eq(players.batchId, fromBatchId));

  await db
    .update(playerCoachAssignments)
    .set({ batchId: toBatchId, updatedAt: new Date() })
    .where(eq(playerCoachAssignments.batchId, fromBatchId));

  await db
    .update(trainingSessions)
    .set({ batchId: toBatchId, updatedAt: new Date() })
    .where(eq(trainingSessions.batchId, fromBatchId));

  await db
    .update(feePlanTemplates)
    .set({ batchId: toBatchId, updatedAt: new Date() })
    .where(eq(feePlanTemplates.batchId, fromBatchId));

  const enrollments = await db
    .select({ playerId: batchEnrollments.playerId })
    .from(batchEnrollments)
    .where(eq(batchEnrollments.batchId, fromBatchId));

  for (const enrollment of enrollments) {
    await db
      .insert(batchEnrollments)
      .values({ batchId: toBatchId, playerId: enrollment.playerId })
      .onConflictDoNothing({
        target: [batchEnrollments.batchId, batchEnrollments.playerId],
      });
  }

  await db.delete(batchEnrollments).where(eq(batchEnrollments.batchId, fromBatchId));

  const coachLinks = await db
    .select({ coachId: batchCoaches.coachId, isPrimary: batchCoaches.isPrimary })
    .from(batchCoaches)
    .where(eq(batchCoaches.batchId, fromBatchId));

  for (const link of coachLinks) {
    await db
      .insert(batchCoaches)
      .values({
        batchId: toBatchId,
        coachId: link.coachId,
        isPrimary: link.isPrimary,
      })
      .onConflictDoNothing({
        target: [batchCoaches.batchId, batchCoaches.coachId],
      });
  }

  await db.delete(batchCoaches).where(eq(batchCoaches.batchId, fromBatchId));
}

/** Collapse duplicate rows that share academy, sport, and batch name. */
export async function dedupeAcademyBatches(academyId: string) {
  const rows = await db
    .select({
      id: batches.id,
      academyId: batches.academyId,
      sportId: batches.sportId,
      name: batches.name,
      createdAt: batches.createdAt,
    })
    .from(batches)
    .where(eq(batches.academyId, academyId))
    .orderBy(batches.sportId, batches.name, batches.createdAt);

  const groups = new Map<string, BatchRow[]>();
  for (const row of rows) {
    const key = `${row.sportId}:${row.name}`;
    const group = groups.get(key) ?? [];
    group.push(row);
    groups.set(key, group);
  }

  const duplicateIds: string[] = [];

  for (const group of groups.values()) {
    if (group.length <= 1) continue;

    const [keeper, ...duplicates] = group;
    for (const duplicate of duplicates) {
      await reassignBatchReferences(duplicate.id, keeper.id);
      duplicateIds.push(duplicate.id);
    }
  }

  if (duplicateIds.length > 0) {
    await db.delete(batches).where(inArray(batches.id, duplicateIds));
  }
}

/** Ensures each academy sport has Sub-junior, Junior, and Senior batches. */
export async function ensureAcademyBatches(academyId: string) {
  await dedupeAcademyBatches(academyId);

  const sportRows = await db
    .select({ id: sports.id })
    .from(academySports)
    .innerJoin(sports, eq(academySports.sportId, sports.id))
    .where(eq(academySports.academyId, academyId));

  for (const sport of sportRows) {
    for (const name of ACADEMY_BATCH_NAMES) {
      const [existing] = await db
        .select({ id: batches.id })
        .from(batches)
        .where(
          and(
            eq(batches.academyId, academyId),
            eq(batches.sportId, sport.id),
            eq(batches.name, name)
          )
        )
        .limit(1);

      if (!existing) {
        await db.insert(batches).values({
          academyId,
          sportId: sport.id,
          name,
        });
      }
    }
  }

  await dedupeAcademyBatches(academyId);
}

/** Read-only batch list for UI dropdowns — skips ensure/dedupe on the hot path. */
export async function listAcademyBatches(academyId: string) {
  const rows = await db
    .select({
      id: batches.id,
      name: batches.name,
      sportId: batches.sportId,
    })
    .from(batches)
    .where(eq(batches.academyId, academyId));

  return sortBatchesByName(rows);
}

export async function getAcademyBatches(academyId: string) {
  await ensureAcademyBatches(academyId);
  return listAcademyBatches(academyId);
}
