import { and, eq, inArray, isNotNull, isNull, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  academySports,
  batchCoaches,
  batches,
  coaches,
  drillSubmissions,
  playerCoachAssignments,
  players,
  sports,
} from "@/db/schema";
import type {
  AssignCoachFormOptions,
  AssignCoachPayload,
  CoachAssignmentGroup,
  AffectedPlayer,
  BatchPrimaryPromotion,
  UnassignPayload,
  UnassignPreview,
  UpdateCoachAssignmentPayload,
} from "@/lib/coaches";
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

export async function getAssignCoachFormOptions(academyId: string): Promise<AssignCoachFormOptions> {
  const sportRows = await db
    .select({ id: sports.id, name: sports.name })
    .from(academySports)
    .innerJoin(sports, eq(academySports.sportId, sports.id))
    .where(eq(academySports.academyId, academyId));

  const batchRows = await db
    .select({ id: batches.id, name: batches.name, sportId: batches.sportId })
    .from(batches)
    .where(eq(batches.academyId, academyId));

  const coachRows = await db
    .select({
      id: coaches.id,
      fullName: coaches.fullName,
      sportId: coaches.sportId,
      nisLevel: coaches.nisLevel,
      staffId: coaches.staffId,
    })
    .from(coaches)
    .where(and(eq(coaches.academyId, academyId), isNotNull(coaches.staffId)))
    .orderBy(coaches.fullName);

  return {
    sports: sportRows,
    batches: batchRows,
    coaches: coachRows.map((row) => ({
      id: row.id,
      fullName: row.fullName,
      sportId: row.sportId,
      nisLevel: row.nisLevel,
      staffId: row.staffId!,
    })),
  };
}

/** @deprecated Use getAssignCoachFormOptions */
export async function getCoachFormOptions(academyId: string) {
  const options = await getAssignCoachFormOptions(academyId);
  return { sports: options.sports };
}

export async function assignCoachToBatches(academyId: string, payload: AssignCoachPayload) {
  const [coach] = await db
    .select()
    .from(coaches)
    .where(and(eq(coaches.id, payload.coachId), eq(coaches.academyId, academyId)))
    .limit(1);

  if (!coach) {
    throw new Error("Coach not found.");
  }

  if (!coach.staffId) {
    throw new Error("Add this person via Fees → Manage staff before assigning batches.");
  }

  const [sport] = await db
    .select({ id: sports.id, name: sports.name })
    .from(sports)
    .innerJoin(academySports, eq(academySports.sportId, sports.id))
    .where(and(eq(academySports.academyId, academyId), eq(sports.id, payload.sportId)))
    .limit(1);

  if (!sport) {
    throw new Error("Selected sport is not offered by this academy.");
  }

  const batchRows = await db
    .select({ id: batches.id, sportId: batches.sportId })
    .from(batches)
    .where(
      and(eq(batches.academyId, academyId), inArray(batches.id, payload.batchIds))
    );

  if (batchRows.length !== payload.batchIds.length) {
    throw new Error("One or more batches were not found for this academy.");
  }

  for (const batch of batchRows) {
    if (batch.sportId !== payload.sportId) {
      throw new Error("All selected batches must belong to the chosen sport.");
    }
  }

  const roleTitle =
    coach.roleTitle?.trim() || `${sport.name} · Coach`;

  const primaryBatchId = payload.primaryBatchId ?? payload.batchIds[0];

  return db.transaction(async (tx) => {
    await tx
      .update(coaches)
      .set({
        sportId: payload.sportId,
        nisLevel: payload.nisLevel,
        roleTitle,
        updatedAt: new Date(),
      })
      .where(eq(coaches.id, coach.id));

    for (const batchId of payload.batchIds) {
      const [existingPrimary] = await tx
        .select({ id: batchCoaches.id })
        .from(batchCoaches)
        .where(and(eq(batchCoaches.batchId, batchId), eq(batchCoaches.isPrimary, true)))
        .limit(1);

      const isPrimary = !existingPrimary && batchId === primaryBatchId;

      await tx
        .insert(batchCoaches)
        .values({
          batchId,
          coachId: coach.id,
          isPrimary,
        })
        .onConflictDoNothing({
          target: [batchCoaches.batchId, batchCoaches.coachId],
        });
    }

    return { coachId: coach.id, batchCount: payload.batchIds.length };
  });
}

async function promoteCoachToBatchPrimary(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  batchId: string,
  coachId: string
) {
  await tx
    .update(batchCoaches)
    .set({ isPrimary: false, updatedAt: new Date() })
    .where(eq(batchCoaches.batchId, batchId));

  await tx
    .update(batchCoaches)
    .set({ isPrimary: true, updatedAt: new Date() })
    .where(and(eq(batchCoaches.batchId, batchId), eq(batchCoaches.coachId, coachId)));
}

async function assertCoachInAcademy(academyId: string, coachId: string) {
  const [coach] = await db
    .select()
    .from(coaches)
    .where(and(eq(coaches.id, coachId), eq(coaches.academyId, academyId)))
    .limit(1);

  if (!coach) {
    throw new Error("Coach not found.");
  }

  return coach;
}

export async function listCoachAssignments(
  academyId: string,
  coachId: string
): Promise<CoachAssignmentGroup[]> {
  const coach = await assertCoachInAcademy(academyId, coachId);

  const rows = await db
    .select({
      batchId: batches.id,
      batchName: batches.name,
      sportId: sports.id,
      sportName: sports.name,
      isPrimary: batchCoaches.isPrimary,
    })
    .from(batchCoaches)
    .innerJoin(batches, eq(batchCoaches.batchId, batches.id))
    .innerJoin(sports, eq(batches.sportId, sports.id))
    .where(and(eq(batchCoaches.coachId, coachId), eq(batches.academyId, academyId)))
    .orderBy(sports.name, batches.name);

  const bySport = new Map<string, CoachAssignmentGroup>();

  for (const row of rows) {
    let group = bySport.get(row.sportId);
    if (!group) {
      group = {
        sportId: row.sportId,
        sportName: row.sportName,
        nisLevel: coach.nisLevel,
        batches: [],
      };
      bySport.set(row.sportId, group);
    }
    group.batches.push({
      id: row.batchId,
      name: row.batchName,
      isPrimary: row.isPrimary,
    });
  }

  return [...bySport.values()];
}

async function listPrimaryPlayersForCoach(academyId: string, coachId: string) {
  return db
    .select({
      id: players.id,
      externalId: players.externalId,
      fullName: players.fullName,
      batchName: batches.name,
      sportName: sports.name,
      batchId: players.batchId,
    })
    .from(players)
    .innerJoin(sports, eq(players.sportId, sports.id))
    .leftJoin(batches, eq(players.batchId, batches.id))
    .where(
      and(
        eq(players.academyId, academyId),
        eq(players.primaryCoachId, coachId),
        inArray(players.status, ["active", "on_hold"])
      )
    )
    .orderBy(players.fullName);
}

async function listPrimaryPlayersForCoachInBatch(
  academyId: string,
  coachId: string,
  batchId: string
) {
  return db
    .select({
      id: players.id,
      externalId: players.externalId,
      fullName: players.fullName,
      batchName: batches.name,
      sportName: sports.name,
      batchId: players.batchId,
    })
    .from(players)
    .innerJoin(sports, eq(players.sportId, sports.id))
    .innerJoin(batches, eq(players.batchId, batches.id))
    .where(
      and(
        eq(players.academyId, academyId),
        eq(players.primaryCoachId, coachId),
        eq(players.batchId, batchId),
        inArray(players.status, ["active", "on_hold"])
      )
    )
    .orderBy(players.fullName);
}

function mapAffectedPlayers(
  rows: {
    id: string;
    externalId: string;
    fullName: string;
    batchName: string | null;
    sportName: string;
  }[]
): AffectedPlayer[] {
  return rows.map((row) => ({
    id: row.id,
    externalId: row.externalId,
    fullName: row.fullName,
    batchName: row.batchName ?? "—",
    sportName: row.sportName,
  }));
}

async function resolveBatchIdsForUnassign(
  academyId: string,
  coachId: string,
  payload: UnassignPayload
): Promise<string[]> {
  if (payload.scope === "all") {
    const rows = await db
      .select({ batchId: batchCoaches.batchId })
      .from(batchCoaches)
      .innerJoin(batches, eq(batchCoaches.batchId, batches.id))
      .where(and(eq(batchCoaches.coachId, coachId), eq(batches.academyId, academyId)));
    return rows.map((row) => row.batchId);
  }

  if (payload.scope === "batch") {
    return [payload.batchId!];
  }

  const rows = await db
    .select({ batchId: batchCoaches.batchId })
    .from(batchCoaches)
    .innerJoin(batches, eq(batchCoaches.batchId, batches.id))
    .where(
      and(
        eq(batchCoaches.coachId, coachId),
        eq(batches.academyId, academyId),
        eq(batches.sportId, payload.sportId!)
      )
    );

  return rows.map((row) => row.batchId);
}

async function previewPromotionsForBatchRemovals(
  academyId: string,
  coachId: string,
  batchIds: string[]
): Promise<BatchPrimaryPromotion[]> {
  if (batchIds.length === 0) return [];

  const promotions: BatchPrimaryPromotion[] = [];

  for (const batchId of batchIds) {
    const [primaryRow] = await db
      .select({
        isPrimary: batchCoaches.isPrimary,
        batchName: batches.name,
      })
      .from(batchCoaches)
      .innerJoin(batches, eq(batchCoaches.batchId, batches.id))
      .where(
        and(
          eq(batchCoaches.batchId, batchId),
          eq(batchCoaches.coachId, coachId),
          eq(batches.academyId, academyId)
        )
      )
      .limit(1);

    if (!primaryRow?.isPrimary) continue;

    const [nextCoach] = await db
      .select({
        coachId: coaches.id,
        coachName: coaches.fullName,
      })
      .from(batchCoaches)
      .innerJoin(coaches, eq(batchCoaches.coachId, coaches.id))
      .where(
        and(eq(batchCoaches.batchId, batchId), ne(batchCoaches.coachId, coachId))
      )
      .orderBy(batchCoaches.createdAt)
      .limit(1);

    if (!nextCoach) continue;

    promotions.push({
      batchId,
      batchName: primaryRow.batchName,
      promotedCoachId: nextCoach.coachId,
      promotedCoachName: nextCoach.coachName,
    });
  }

  return promotions;
}

export async function previewUnassignPlayers(
  academyId: string,
  coachId: string,
  payload: UnassignPayload
): Promise<UnassignPreview> {
  await assertCoachInAcademy(academyId, coachId);

  const batchIds = await resolveBatchIdsForUnassign(academyId, coachId, payload);

  let playerRows: AffectedPlayer[] = [];

  if (payload.scope === "batch") {
    playerRows = mapAffectedPlayers(
      await listPrimaryPlayersForCoachInBatch(academyId, coachId, payload.batchId!)
    );
  } else {
    playerRows = mapAffectedPlayers(await listPrimaryPlayersForCoach(academyId, coachId));
  }

  const promotions = await previewPromotionsForBatchRemovals(academyId, coachId, batchIds);

  return { players: playerRows, promotions };
}

async function clearPrimaryCoachFromPlayers(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  playerIds: string[],
  coachId: string
) {
  if (playerIds.length === 0) return;

  await tx
    .update(players)
    .set({ primaryCoachId: null, updatedAt: new Date() })
    .where(inArray(players.id, playerIds));

  await tx
    .delete(playerCoachAssignments)
    .where(
      and(
        inArray(playerCoachAssignments.playerId, playerIds),
        eq(playerCoachAssignments.coachId, coachId)
      )
    );
}

async function promoteNextBatchPrimary(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  batchId: string,
  removedCoachId: string
) {
  const [wasPrimary] = await tx
    .select({ id: batchCoaches.id })
    .from(batchCoaches)
    .where(
      and(
        eq(batchCoaches.batchId, batchId),
        eq(batchCoaches.coachId, removedCoachId),
        eq(batchCoaches.isPrimary, true)
      )
    )
    .limit(1);

  if (!wasPrimary) return;

  const [next] = await tx
    .select({ id: batchCoaches.id })
    .from(batchCoaches)
    .where(and(eq(batchCoaches.batchId, batchId), ne(batchCoaches.coachId, removedCoachId)))
    .orderBy(batchCoaches.createdAt)
    .limit(1);

  if (!next) return;

  await tx
    .update(batchCoaches)
    .set({ isPrimary: false, updatedAt: new Date() })
    .where(eq(batchCoaches.batchId, batchId));

  await tx
    .update(batchCoaches)
    .set({ isPrimary: true, updatedAt: new Date() })
    .where(eq(batchCoaches.id, next.id));
}

export async function unassignCoach(
  academyId: string,
  coachId: string,
  payload: UnassignPayload
) {
  await assertCoachInAcademy(academyId, coachId);

  const batchIds = await resolveBatchIdsForUnassign(academyId, coachId, payload);
  if (batchIds.length === 0 && payload.scope !== "all") {
    throw new Error("No assignments found to remove.");
  }

  const preview = await previewUnassignPlayers(academyId, coachId, payload);
  const playerIds = preview.players.map((player) => player.id);

  return db.transaction(async (tx) => {
    for (const batchId of batchIds) {
      await promoteNextBatchPrimary(tx, batchId, coachId);

      await tx
        .delete(batchCoaches)
        .where(and(eq(batchCoaches.batchId, batchId), eq(batchCoaches.coachId, coachId)));
    }

    await clearPrimaryCoachFromPlayers(tx, playerIds, coachId);

    const remaining = await tx
      .select({ id: batchCoaches.id })
      .from(batchCoaches)
      .innerJoin(batches, eq(batchCoaches.batchId, batches.id))
      .where(and(eq(batchCoaches.coachId, coachId), eq(batches.academyId, academyId)))
      .limit(1);

    if (!remaining.length) {
      await tx
        .update(coaches)
        .set({ roleTitle: "Coach", updatedAt: new Date() })
        .where(eq(coaches.id, coachId));
    }

    return {
      removedBatchCount: batchIds.length,
      clearedPlayerCount: playerIds.length,
      promotions: preview.promotions,
    };
  });
}

export async function updateCoachSportAssignment(
  academyId: string,
  coachId: string,
  payload: UpdateCoachAssignmentPayload
) {
  const coach = await assertCoachInAcademy(academyId, coachId);

  if (!coach.staffId) {
    throw new Error("Add this person via Fees → Manage staff before assigning batches.");
  }

  const [sport] = await db
    .select({ id: sports.id, name: sports.name })
    .from(sports)
    .innerJoin(academySports, eq(academySports.sportId, sports.id))
    .where(and(eq(academySports.academyId, academyId), eq(sports.id, payload.sportId)))
    .limit(1);

  if (!sport) {
    throw new Error("Selected sport is not offered by this academy.");
  }

  const batchRows = await db
    .select({ id: batches.id, sportId: batches.sportId })
    .from(batches)
    .where(and(eq(batches.academyId, academyId), inArray(batches.id, payload.batchIds)));

  if (batchRows.length !== payload.batchIds.length) {
    throw new Error("One or more batches were not found for this academy.");
  }

  for (const batch of batchRows) {
    if (batch.sportId !== payload.sportId) {
      throw new Error("All selected batches must belong to the chosen sport.");
    }
  }

  const currentInSport = await db
    .select({ batchId: batchCoaches.batchId })
    .from(batchCoaches)
    .innerJoin(batches, eq(batchCoaches.batchId, batches.id))
    .where(
      and(
        eq(batchCoaches.coachId, coachId),
        eq(batches.academyId, academyId),
        eq(batches.sportId, payload.sportId)
      )
    );

  const currentIds = new Set(currentInSport.map((row) => row.batchId));
  const nextIds = new Set(payload.batchIds);
  const removedBatchIds = [...currentIds].filter((id) => !nextIds.has(id));
  const addedBatchIds = [...nextIds].filter((id) => !currentIds.has(id));

  const roleTitle = `${sport.name} · Coach`;

  return db.transaction(async (tx) => {
    await tx
      .update(coaches)
      .set({
        sportId: payload.sportId,
        nisLevel: payload.nisLevel,
        roleTitle,
        updatedAt: new Date(),
      })
      .where(eq(coaches.id, coachId));

    for (const batchId of removedBatchIds) {
      await promoteNextBatchPrimary(tx, batchId, coachId);
      await tx
        .delete(batchCoaches)
        .where(and(eq(batchCoaches.batchId, batchId), eq(batchCoaches.coachId, coachId)));

      const batchPlayers = await listPrimaryPlayersForCoachInBatch(academyId, coachId, batchId);
      await clearPrimaryCoachFromPlayers(
        tx,
        batchPlayers.map((player) => player.id),
        coachId
      );
    }

    for (const batchId of addedBatchIds) {
      await tx
        .insert(batchCoaches)
        .values({ batchId, coachId, isPrimary: false })
        .onConflictDoNothing({ target: [batchCoaches.batchId, batchCoaches.coachId] });
    }

    const primaryBatchId = payload.primaryBatchId ?? payload.batchIds[0];

    for (const batchId of payload.batchIds) {
      if (batchId === primaryBatchId) {
        await promoteCoachToBatchPrimary(tx, batchId, coachId);
      } else {
        await tx
          .update(batchCoaches)
          .set({ isPrimary: false, updatedAt: new Date() })
          .where(and(eq(batchCoaches.batchId, batchId), eq(batchCoaches.coachId, coachId)));
      }
    }

    return {
      coachId,
      sportId: payload.sportId,
      batchCount: payload.batchIds.length,
      removedBatchCount: removedBatchIds.length,
      addedBatchCount: addedBatchIds.length,
    };
  });
}
