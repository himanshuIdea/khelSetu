import { and, desc, eq, inArray, like, ne, sql } from "drizzle-orm";
import { db, isUniqueViolation } from "@/lib/db";
import {
  academySports,
  attendanceRecords,
  batchCoaches,
  batchEnrollments,
  batches,
  coaches,
  drillReviews,
  drillSubmissions,
  feeInvoices,
  feePayments,
  playerCoachAssignments,
  players,
  sports,
  teamMemberResults,
  teamMembers,
  type DrillReviewCriteriaScores,
} from "@/db/schema";
import {
  currentFeePeriod,
  formatAge,
  formatDate,
  formatFeeStatus,
  formatPaiseFull,
  formatSportWeightLine,
  formatTimeAgo,
  formatWeightKg,
  getInitials,
  resolvePlayerFeeDisplay,
} from "@/lib/format";
import { isAcademyBatchName } from "@/lib/batches";
import {
  sportExternalCode,
  type CreatePlayerPayload,
  type PlayerEditData,
  type PlayerFormOptions,
  type UpdatePlayerPayload,
} from "@/lib/players";
import { listAcademyBatches } from "@/lib/repositories/batches";
import { recordActivityEvent } from "@/lib/repositories/activity";
import type { Player, PlayerDetail } from "./types";

function formatPlayerAttendanceRate(present: unknown, total: unknown): string {
  const totalN = Number(total);
  const presentN = Number(present);
  if (!Number.isFinite(totalN) || !Number.isFinite(presentN) || totalN <= 0) {
    return "—";
  }
  return `${Math.round((presentN / totalN) * 100)}%`;
}

async function getPlayerAttendanceRate(playerId: string): Promise<string> {
  const [row] = await db
    .select({
      present: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'present')`,
      total: sql<number>`count(*)`,
    })
    .from(attendanceRecords)
    .where(eq(attendanceRecords.playerId, playerId));

  return formatPlayerAttendanceRate(row?.present, row?.total);
}

export async function getPlayers(academyId: string): Promise<Player[]> {
  const rows = await db
    .select({
      player: players,
      sportName: sports.name,
      batchName: batches.name,
    })
    .from(players)
    .innerJoin(sports, eq(players.sportId, sports.id))
    .leftJoin(batches, eq(players.batchId, batches.id))
    .where(and(eq(players.academyId, academyId), ne(players.status, "inactive")));

  const playerIds = rows.map((row) => row.player.id);

  const [invoiceRows, attendanceRows] =
    playerIds.length > 0
      ? await Promise.all([
          db
            .selectDistinctOn([feeInvoices.playerId], {
              playerId: feeInvoices.playerId,
              status: feeInvoices.status,
              period: feeInvoices.period,
              amountPaise: feeInvoices.amountPaise,
            })
            .from(feeInvoices)
            .where(inArray(feeInvoices.playerId, playerIds))
            .orderBy(feeInvoices.playerId, desc(feeInvoices.period)),
          db
            .select({
              playerId: attendanceRecords.playerId,
              present: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'present')`,
              total: sql<number>`count(*)`,
            })
            .from(attendanceRecords)
            .where(inArray(attendanceRecords.playerId, playerIds))
            .groupBy(attendanceRecords.playerId),
        ])
      : [[], []];

  const invoiceByPlayer = new Map(invoiceRows.map((invoice) => [invoice.playerId, invoice]));
  const attendanceByPlayer = new Map(
    attendanceRows.map((row) => [
      row.playerId,
      formatPlayerAttendanceRate(row.present, row.total),
    ])
  );

  const result: Player[] = [];

  for (const row of rows) {
    const invoice = invoiceByPlayer.get(row.player.id);
    const fee = resolvePlayerFeeDisplay(invoice, row.player.monthlyFeePaise);

    const attendance = attendanceByPlayer.get(row.player.id) ?? "—";

    result.push({
      initials: getInitials(row.player.fullName),
      name: row.player.fullName,
      id: row.player.externalId,
      age: formatAge(row.player.dateOfBirth),
      sport: row.sportName,
      weight: formatWeightKg(row.player.weightCategory),
      batch: row.batchName ?? "—",
      fees: fee.label,
      feesVariant: fee.variant,
      attendance,
      status: row.player.status === "on_hold" ? "On hold" : "Active",
      statusVariant: row.player.status === "on_hold" ? "amber" : "green",
      avatarColor: row.player.avatarColor,
      highlighted: row.player.externalId === "HRWR-1042",
    });
  }

  return result;
}

export async function getPlayerDetail(
  academyId: string,
  externalId?: string
): Promise<PlayerDetail | null> {
  const condition = externalId
    ? and(eq(players.academyId, academyId), eq(players.externalId, externalId))
    : eq(players.academyId, academyId);

  const [row] = await db
    .select({
      player: players,
      sportName: sports.name,
      coachName: coaches.fullName,
      batchName: batches.name,
    })
    .from(players)
    .innerJoin(sports, eq(players.sportId, sports.id))
    .leftJoin(coaches, eq(players.primaryCoachId, coaches.id))
    .leftJoin(batches, eq(players.batchId, batches.id))
    .where(condition)
    .limit(1);

  if (!row) return null;

  const [[invoice], [wins], attendance] = await Promise.all([
    db
      .select()
      .from(feeInvoices)
      .where(eq(feeInvoices.playerId, row.player.id))
      .orderBy(sql`${feeInvoices.period} desc`)
      .limit(1),
    db
      .select({ count: sql<number>`count(*)` })
      .from(teamMemberResults)
      .innerJoin(teamMembers, eq(teamMemberResults.teamMemberId, teamMembers.id))
      .where(and(eq(teamMembers.playerId, row.player.id), eq(teamMemberResults.result, "W"))),
    getPlayerAttendanceRate(row.player.id),
  ]);

  return {
    initials: getInitials(row.player.fullName),
    name: row.player.fullName,
    id: row.player.externalId,
    sport: formatSportWeightLine(`${row.sportName} · ${row.player.weightCategory ?? "—"}`),
    rating: row.player.rating != null ? String(row.player.rating) : "—",
    attendance,
    boutsWon: String(Number(wins?.count ?? 0) || 0),
    joined: row.player.joinedAt ? formatDate(row.player.joinedAt) : "—",
    coach: row.player.primaryCoachId ? row.coachName : null,
    coachUnassigned: !row.player.primaryCoachId,
    monthlyFee:
      row.player.monthlyFeePaise != null
        ? formatPaiseFull(row.player.monthlyFeePaise)
        : invoice
          ? formatPaiseFull(invoice.amountPaise)
          : "—",
    batch: row.batchName ?? "—",
    status:
      row.player.status === "on_hold"
        ? "On hold"
        : row.player.status === "inactive"
          ? "Inactive"
          : "Active",
    feeStatus: invoice
      ? invoice.status === "paid"
        ? `Paid till ${invoice.paidThroughPeriod ?? invoice.period}`
        : invoice.status === "partial"
          ? "Partial due"
          : "Due"
      : "—",
  };
}

export async function getPlayerCounts(academyId: string) {
  const [row] = await db
    .select({
      active: sql<number>`count(*) filter (where ${players.status} = 'active')`,
      onHold: sql<number>`count(*) filter (where ${players.status} = 'on_hold')`,
    })
    .from(players)
    .where(and(eq(players.academyId, academyId), ne(players.status, "inactive")));

  return {
    active: Number(row?.active ?? 0),
    onHold: Number(row?.onHold ?? 0),
  };
}

export async function getPlayerFormOptions(academyId: string): Promise<PlayerFormOptions> {
  const [sportRows, batchRows, coachRows, batchCoachRows] = await Promise.all([
    db
      .select({ id: sports.id, name: sports.name })
      .from(academySports)
      .innerJoin(sports, eq(academySports.sportId, sports.id))
      .where(eq(academySports.academyId, academyId)),
    listAcademyBatches(academyId),
    db
      .select({ id: coaches.id, name: coaches.fullName, sportId: coaches.sportId })
      .from(coaches)
      .where(eq(coaches.academyId, academyId)),
    db
      .select({
        batchId: batchCoaches.batchId,
        coachId: batchCoaches.coachId,
        coachName: coaches.fullName,
        isPrimary: batchCoaches.isPrimary,
      })
      .from(batchCoaches)
      .innerJoin(batches, eq(batchCoaches.batchId, batches.id))
      .innerJoin(coaches, eq(batchCoaches.coachId, coaches.id))
      .where(eq(batches.academyId, academyId)),
  ]);

  return {
    sports: sportRows,
    batches: batchRows,
    coaches: coachRows,
    batchCoachAssignments: batchCoachRows.map((row) => ({
      batchId: row.batchId,
      coachId: row.coachId,
      coachName: row.coachName,
      isPrimary: row.isPrimary,
    })),
  };
}

async function validatePlayerRelations(
  academyId: string,
  payload: CreatePlayerPayload | UpdatePlayerPayload
) {
  const [sport] = await db
    .select({ id: sports.id, name: sports.name, color: sports.color })
    .from(sports)
    .innerJoin(academySports, eq(academySports.sportId, sports.id))
    .where(and(eq(academySports.academyId, academyId), eq(sports.id, payload.sportId)))
    .limit(1);

  if (!sport) {
    throw new Error("Selected sport is not offered by this academy.");
  }

  const [batch] = await db
    .select({ id: batches.id, name: batches.name })
    .from(batches)
    .where(
      and(
        eq(batches.id, payload.batchId),
        eq(batches.academyId, academyId),
        eq(batches.sportId, payload.sportId)
      )
    )
    .limit(1);

  if (!batch) {
    throw new Error("Selected batch is invalid for this sport.");
  }

  if (!isAcademyBatchName(batch.name)) {
    throw new Error("Selected batch is not a valid academy batch.");
  }

  if (payload.primaryCoachId) {
    const [assignment] = await db
      .select({ id: batchCoaches.id })
      .from(batchCoaches)
      .where(
        and(
          eq(batchCoaches.batchId, payload.batchId),
          eq(batchCoaches.coachId, payload.primaryCoachId)
        )
      )
      .limit(1);

    if (!assignment) {
      throw new Error("Selected coach is not assigned to this batch.");
    }
  }

  return sport;
}

async function generatePlayerExternalId(academyId: string, sportName: string) {
  const code = sportExternalCode(sportName);
  const prefix = `HR${code}`;

  const existing = await db
    .select({ externalId: players.externalId })
    .from(players)
    .where(and(eq(players.academyId, academyId), like(players.externalId, `${prefix}-%`)));

  let max = 1000;
  for (const row of existing) {
    const suffix = row.externalId.split("-")[1];
    const num = Number.parseInt(suffix ?? "", 10);
    if (!Number.isNaN(num) && num > max) max = num;
  }

  return `${prefix}-${String(max + 1).padStart(4, "0")}`;
}

export async function getPlayerForEdit(
  academyId: string,
  externalId: string
): Promise<PlayerEditData | null> {
  const [row] = await db
    .select({ player: players })
    .from(players)
    .where(
      and(
        eq(players.academyId, academyId),
        eq(players.externalId, externalId),
        ne(players.status, "inactive")
      )
    )
    .limit(1);

  if (!row) return null;

  const player = row.player;
  return {
    externalId: player.externalId,
    fullName: player.fullName,
    sportId: player.sportId,
    batchId: player.batchId ?? "",
    weightCategory: player.weightCategory ?? "",
    heightCategory: player.heightCategory ?? "",
    dateOfBirth: player.dateOfBirth ? player.dateOfBirth.toISOString().slice(0, 10) : "",
    monthlyFeePaise: player.monthlyFeePaise ?? undefined,
    primaryCoachId: player.primaryCoachId ?? "",
    status: player.status === "on_hold" ? "on_hold" : "active",
  };
}

export async function createPlayer(academyId: string, payload: CreatePlayerPayload) {
  const sport = await validatePlayerRelations(academyId, payload);

  const externalId = await generatePlayerExternalId(academyId, sport.name);
  const joinedAt = new Date();
  const dateOfBirth = payload.dateOfBirth ? new Date(payload.dateOfBirth) : null;

  try {
    const created = await db.transaction(async (tx) => {
      const [player] = await tx
        .insert(players)
        .values({
          academyId,
          externalId,
          fullName: payload.fullName.trim(),
          sportId: payload.sportId,
          batchId: payload.batchId ?? null,
          primaryCoachId: payload.primaryCoachId ?? null,
          dateOfBirth,
          weightCategory: payload.weightCategory?.trim() || null,
          heightCategory: payload.heightCategory?.trim() || null,
          status: payload.status ?? "active",
          avatarColor: sport.color,
          monthlyFeePaise: payload.monthlyFeePaise ?? null,
          joinedAt,
        })
        .returning({ id: players.id, externalId: players.externalId });

      if (payload.batchId) {
        await tx
          .insert(batchEnrollments)
          .values({ batchId: payload.batchId, playerId: player.id })
          .onConflictDoNothing({
            target: [batchEnrollments.batchId, batchEnrollments.playerId],
          });
      }

      if (payload.primaryCoachId) {
        await tx
          .insert(playerCoachAssignments)
          .values({
            playerId: player.id,
            coachId: payload.primaryCoachId,
            batchId: payload.batchId ?? null,
            isPrimary: true,
          })
          .onConflictDoNothing({
            target: [playerCoachAssignments.playerId, playerCoachAssignments.coachId],
          });
      }

      if (payload.monthlyFeePaise != null && payload.monthlyFeePaise > 0) {
        const period = currentFeePeriod();
        const [invoice] = await tx
          .insert(feeInvoices)
          .values({
            playerId: player.id,
            academyId,
            period,
            amountPaise: payload.monthlyFeePaise,
            status: "paid",
            paidThroughPeriod: period,
          })
          .onConflictDoUpdate({
            target: [feeInvoices.playerId, feeInvoices.period],
            set: {
              status: "paid",
              amountPaise: payload.monthlyFeePaise,
              paidThroughPeriod: period,
              updatedAt: new Date(),
            },
          })
          .returning({ id: feeInvoices.id });

        if (invoice) {
          const [existingPayment] = await tx
            .select({ id: feePayments.id })
            .from(feePayments)
            .where(eq(feePayments.invoiceId, invoice.id))
            .limit(1);

          if (!existingPayment) {
            await tx.insert(feePayments).values({
              invoiceId: invoice.id,
              amountPaise: payload.monthlyFeePaise,
              paidAt: joinedAt,
              method: "enrollment",
            });
          }
        }
      }

      return player;
    });

    await recordActivityEvent({
      academyId,
      eventType: "player_enrolled",
      actorName: payload.fullName.trim(),
      description: `enrolled in ${sport.name}`,
      metadata: { type: "users" },
    });

    return created;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new Error("A player with this ID already exists. Please try again.");
    }
    throw error;
  }
}

export async function updatePlayer(
  academyId: string,
  externalId: string,
  payload: UpdatePlayerPayload
) {
  const [existing] = await db
    .select({ id: players.id })
    .from(players)
    .where(
      and(
        eq(players.academyId, academyId),
        eq(players.externalId, externalId),
        ne(players.status, "inactive")
      )
    )
    .limit(1);

  if (!existing) {
    throw new Error("Player not found.");
  }

  const sport = await validatePlayerRelations(academyId, payload);
  const dateOfBirth = payload.dateOfBirth ? new Date(payload.dateOfBirth) : null;

  return db.transaction(async (tx) => {
    const [player] = await tx
      .update(players)
      .set({
        fullName: payload.fullName.trim(),
        sportId: payload.sportId,
        batchId: payload.batchId,
        primaryCoachId: payload.primaryCoachId || null,
        dateOfBirth,
        weightCategory: payload.weightCategory?.trim() || null,
        heightCategory: payload.heightCategory?.trim() || null,
        status: payload.status ?? "active",
        monthlyFeePaise: payload.monthlyFeePaise ?? null,
        avatarColor: sport.color,
        updatedAt: new Date(),
      })
      .where(eq(players.id, existing.id))
      .returning({ id: players.id, externalId: players.externalId });

    await tx
      .insert(batchEnrollments)
      .values({ batchId: payload.batchId, playerId: existing.id })
      .onConflictDoNothing({
        target: [batchEnrollments.batchId, batchEnrollments.playerId],
      });

    if (payload.primaryCoachId) {
      await tx
        .insert(playerCoachAssignments)
        .values({
          playerId: existing.id,
          coachId: payload.primaryCoachId,
          batchId: payload.batchId,
          isPrimary: true,
        })
        .onConflictDoNothing({
          target: [playerCoachAssignments.playerId, playerCoachAssignments.coachId],
        });
    }

    if (payload.monthlyFeePaise != null && payload.monthlyFeePaise > 0) {
      const period = currentFeePeriod();
      await tx
        .insert(feeInvoices)
        .values({
          playerId: existing.id,
          academyId,
          period,
          amountPaise: payload.monthlyFeePaise,
          status: "paid",
          paidThroughPeriod: period,
        })
        .onConflictDoUpdate({
          target: [feeInvoices.playerId, feeInvoices.period],
          set: {
            amountPaise: payload.monthlyFeePaise,
            updatedAt: new Date(),
          },
        });
    }

    return player;
  });
}

export async function removePlayer(academyId: string, externalId: string) {
  const [existing] = await db
    .select({ id: players.id })
    .from(players)
    .where(
      and(
        eq(players.academyId, academyId),
        eq(players.externalId, externalId),
        ne(players.status, "inactive")
      )
    )
    .limit(1);

  if (!existing) {
    throw new Error("Player not found.");
  }

  await db.transaction(async (tx) => {
    await tx
      .update(players)
      .set({
        status: "inactive",
        primaryCoachId: null,
        batchId: null,
        updatedAt: new Date(),
      })
      .where(eq(players.id, existing.id));

    await tx
      .delete(playerCoachAssignments)
      .where(eq(playerCoachAssignments.playerId, existing.id));

    await tx.delete(batchEnrollments).where(eq(batchEnrollments.playerId, existing.id));
  });
}

export type CoachPlayerFilters = {
  batchId?: string;
  status?: "all" | "active" | "on_hold";
};

export type CoachPlayerFormOptions = {
  batches: { id: string; name: string; sportId: string }[];
};

export async function getCoachPlayerFormOptions(
  academyId: string,
  coachId: string
): Promise<CoachPlayerFormOptions> {
  const { listCoachAssignments } = await import("@/lib/repositories/coaches");
  const assignments = await listCoachAssignments(academyId, coachId);

  const batches = assignments.flatMap((group) =>
    group.batches.map((batch) => ({
      id: batch.id,
      name: batch.name,
      sportId: group.sportId,
    }))
  );

  return { batches };
}

export async function getCoachPlayers(
  academyId: string,
  coachId: string,
  filters: CoachPlayerFilters = {}
): Promise<Player[]> {
  const { getCoachAssignedBatchIds } = await import("@/lib/repositories/coaches");
  const batchIds = await getCoachAssignedBatchIds(academyId, coachId);

  if (batchIds.length === 0) {
    return [];
  }

  const scopedBatchIds = filters.batchId
    ? batchIds.includes(filters.batchId)
      ? [filters.batchId]
      : []
    : batchIds;

  if (scopedBatchIds.length === 0) {
    return [];
  }

  const statusCondition =
    filters.status === "active"
      ? eq(players.status, "active")
      : filters.status === "on_hold"
        ? eq(players.status, "on_hold")
        : inArray(players.status, ["active", "on_hold"]);

  const rows = await db
    .select({
      player: players,
      sportName: sports.name,
      batchName: batches.name,
    })
    .from(players)
    .innerJoin(sports, eq(players.sportId, sports.id))
    .leftJoin(batches, eq(players.batchId, batches.id))
    .where(
      and(
        eq(players.academyId, academyId),
        inArray(players.batchId, scopedBatchIds),
        statusCondition
      )
    );

  const playerIds = rows.map((row) => row.player.id);

  const attendanceRows =
    playerIds.length > 0
      ? await db
          .select({
            playerId: attendanceRecords.playerId,
            present: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'present')`,
            total: sql<number>`count(*)`,
          })
          .from(attendanceRecords)
          .where(inArray(attendanceRecords.playerId, playerIds))
          .groupBy(attendanceRecords.playerId)
      : [];

  const attendanceByPlayer = new Map(
    attendanceRows.map((row) => [
      row.playerId,
      formatPlayerAttendanceRate(row.present, row.total),
    ])
  );

  return rows.map((row) => ({
    initials: getInitials(row.player.fullName),
    name: row.player.fullName,
    id: row.player.externalId,
    age: formatAge(row.player.dateOfBirth),
    sport: row.sportName,
    weight: formatWeightKg(row.player.weightCategory),
    batch: row.batchName ?? "—",
    fees: "—",
    feesVariant: "grey" as const,
    attendance: attendanceByPlayer.get(row.player.id) ?? "—",
    status: row.player.status === "on_hold" ? "On hold" : "Active",
    statusVariant: row.player.status === "on_hold" ? "amber" : "green",
    avatarColor: row.player.avatarColor,
  }));
}

export async function getCoachPlayerDetail(
  academyId: string,
  coachId: string,
  externalId: string
): Promise<PlayerDetail | null> {
  const { getCoachAssignedBatchIds } = await import("@/lib/repositories/coaches");
  const batchIds = await getCoachAssignedBatchIds(academyId, coachId);

  const [row] = await db
    .select({ batchId: players.batchId })
    .from(players)
    .where(and(eq(players.academyId, academyId), eq(players.externalId, externalId)))
    .limit(1);

  if (!row?.batchId || !batchIds.includes(row.batchId)) {
    return null;
  }

  return getPlayerDetail(academyId, externalId);
}

export async function isCoachPlayerInScope(
  academyId: string,
  coachId: string,
  externalId: string
): Promise<boolean> {
  const detail = await getCoachPlayerDetail(academyId, coachId, externalId);
  return detail !== null;
}

export async function resolvePlayerForUser(academyId: string, userId: string) {
  const [row] = await db
    .select({ id: players.id })
    .from(players)
    .where(and(eq(players.academyId, academyId), eq(players.userId, userId)))
    .limit(1);

  return row ?? null;
}

export type PlayerPortalSkillScore = {
  key: keyof DrillReviewCriteriaScores;
  label: string;
  score: number;
};

export type PlayerPortalRatingPoint = {
  rating: number;
  reviewedAt: string;
  timeAgo: string;
  drillName: string;
};

export type PlayerPortalProfile = {
  playerId: string;
  externalId: string;
  fullName: string;
  initials: string;
  avatarColor: string;
  sportName: string;
  weightCategory: string | null;
  batchName: string | null;
  coachName: string | null;
  status: string;
  rating: string | null;
  usesReviewAverage: boolean;
  reviewCount: number;
  attendance: string;
  sessionsCount: number;
  drillsDone: number;
  boutsWon: number;
  joinedAt: string | null;
  ratingTrend: PlayerPortalRatingPoint[];
  skillScores: PlayerPortalSkillScore[];
};

const SKILL_LABELS: Record<keyof DrillReviewCriteriaScores, string> = {
  technique: "Technique",
  speed: "Speed",
  form: "Form",
};

function averageSkillScores(
  rows: { criteria: DrillReviewCriteriaScores | null; rating: number | null }[]
): PlayerPortalSkillScore[] {
  const totals: Record<keyof DrillReviewCriteriaScores, { sum: number; count: number }> = {
    technique: { sum: 0, count: 0 },
    speed: { sum: 0, count: 0 },
    form: { sum: 0, count: 0 },
  };

  for (const row of rows) {
    const criteria = row.criteria;
    if (criteria) {
      for (const key of Object.keys(SKILL_LABELS) as (keyof DrillReviewCriteriaScores)[]) {
        const value = criteria[key];
        if (typeof value === "number" && Number.isFinite(value)) {
          totals[key].sum += value;
          totals[key].count += 1;
        }
      }
    } else if (row.rating != null) {
      for (const key of Object.keys(SKILL_LABELS) as (keyof DrillReviewCriteriaScores)[]) {
        totals[key].sum += row.rating;
        totals[key].count += 1;
      }
    }
  }

  return (Object.keys(SKILL_LABELS) as (keyof DrillReviewCriteriaScores)[])
    .map((key) => {
      const { sum, count } = totals[key];
      if (count === 0) return null;
      return {
        key,
        label: SKILL_LABELS[key],
        score: Math.round((sum / count) * 10) / 10,
      };
    })
    .filter((row): row is PlayerPortalSkillScore => row != null);
}

function formatPortalOverallRating(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function averageReviewRating(
  rows: { rating: number | null }[]
): number | null {
  const ratings = rows.map((row) => row.rating).filter((rating): rating is number => rating != null);
  if (ratings.length === 0) return null;
  return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
}

export async function getPlayerPortalProfile(
  academyId: string,
  playerId: string
): Promise<PlayerPortalProfile | null> {
  const [row] = await db
    .select({
      player: players,
      sportName: sports.name,
      coachName: coaches.fullName,
      batchName: batches.name,
    })
    .from(players)
    .innerJoin(sports, eq(players.sportId, sports.id))
    .leftJoin(coaches, eq(players.primaryCoachId, coaches.id))
    .leftJoin(batches, eq(players.batchId, batches.id))
    .where(and(eq(players.academyId, academyId), eq(players.id, playerId)))
    .limit(1);

  if (!row) return null;

  const [[wins], [sessionsRow], [drillsRow], attendance, reviewRows, trendRows] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(teamMemberResults)
      .innerJoin(teamMembers, eq(teamMemberResults.teamMemberId, teamMembers.id))
      .where(and(eq(teamMembers.playerId, row.player.id), eq(teamMemberResults.result, "W"))),
    db
      .select({ count: sql<number>`count(*)` })
      .from(attendanceRecords)
      .where(
        and(eq(attendanceRecords.playerId, row.player.id), eq(attendanceRecords.status, "present"))
      ),
    db
      .select({ count: sql<number>`count(*)` })
      .from(drillSubmissions)
      .where(eq(drillSubmissions.playerId, row.player.id)),
    getPlayerAttendanceRate(row.player.id),
    db
      .select({
        criteria: drillReviews.criteriaScores,
        rating: drillReviews.rating,
      })
      .from(drillReviews)
      .innerJoin(drillSubmissions, eq(drillReviews.submissionId, drillSubmissions.id))
      .where(eq(drillSubmissions.playerId, row.player.id)),
    db
      .select({
        rating: drillReviews.rating,
        reviewedAt: drillReviews.reviewedAt,
        drillName: drillSubmissions.drillName,
      })
      .from(drillReviews)
      .innerJoin(drillSubmissions, eq(drillReviews.submissionId, drillSubmissions.id))
      .where(and(eq(drillSubmissions.playerId, row.player.id), sql`${drillReviews.rating} is not null`))
      .orderBy(desc(drillReviews.reviewedAt))
      .limit(8),
  ]);

  const reviewAverage = averageReviewRating(reviewRows);
  const ratedReviewCount = reviewRows.filter((row) => row.rating != null).length;

  const statusLabel =
    row.player.status === "on_hold"
      ? "On hold"
      : row.player.status === "inactive"
        ? "Inactive"
        : "Active";

  return {
    playerId: row.player.id,
    externalId: row.player.externalId,
    fullName: row.player.fullName,
    initials: getInitials(row.player.fullName),
    avatarColor: row.player.avatarColor,
    sportName: row.sportName,
    weightCategory: row.player.weightCategory,
    batchName: row.batchName,
    coachName: row.player.primaryCoachId ? row.coachName : null,
    status: statusLabel,
    rating:
      row.player.rating != null
        ? String(row.player.rating)
        : reviewAverage != null
          ? formatPortalOverallRating(reviewAverage)
          : null,
    usesReviewAverage: row.player.rating == null && reviewAverage != null,
    reviewCount: ratedReviewCount,
    attendance,
    sessionsCount: Number(sessionsRow?.count ?? 0) || 0,
    drillsDone: Number(drillsRow?.count ?? 0) || 0,
    boutsWon: Number(wins?.count ?? 0) || 0,
    joinedAt: row.player.joinedAt ? formatDate(row.player.joinedAt) : null,
    ratingTrend: trendRows
      .filter((point) => point.rating != null)
      .map((point) => ({
        rating: point.rating!,
        reviewedAt: point.reviewedAt.toISOString(),
        timeAgo: formatTimeAgo(point.reviewedAt),
        drillName: point.drillName,
      }))
      .reverse(),
    skillScores: averageSkillScores(reviewRows),
  };
}
