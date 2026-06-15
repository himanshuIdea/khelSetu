import { and, eq, gte, lte, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  parseDateOnly,
  scheduledAtForDate,
  type AttendanceFormOptions,
  type AttendanceMarkSession,
  type AttendanceMarkStatus,
  type BatchAttendanceHistoryEntry,
  type SaveAttendancePayload,
} from "@/lib/attendance";
import { getInitials } from "@/lib/format";
import {
  academySports,
  attendanceRecords,
  batchCoaches,
  batches,
  coaches,
  players,
  sports,
  trainingSessions,
} from "@/db/schema";
import { listAcademyBatches } from "@/lib/repositories/batches";
import type { AttendanceSession } from "./types";

export async function getAttendanceFormOptions(academyId: string): Promise<AttendanceFormOptions> {
  const [sportRows, batchRows] = await Promise.all([
    db
      .select({ id: sports.id, name: sports.name })
      .from(academySports)
      .innerJoin(sports, eq(academySports.sportId, sports.id))
      .where(eq(academySports.academyId, academyId)),
    listAcademyBatches(academyId),
  ]);

  return { sports: sportRows, batches: batchRows };
}

async function assertBatchInAcademy(academyId: string, batchId: string) {
  const [batch] = await db
    .select({ id: batches.id, sportId: batches.sportId, name: batches.name })
    .from(batches)
    .where(and(eq(batches.academyId, academyId), eq(batches.id, batchId)))
    .limit(1);

  if (!batch) {
    throw new Error("Batch not found for this academy.");
  }

  return batch;
}

async function resolveCoachForBatch(academyId: string, batchId: string, sportId: string) {
  const [primaryCoach] = await db
    .select({ coachId: batchCoaches.coachId })
    .from(batchCoaches)
    .where(and(eq(batchCoaches.batchId, batchId), eq(batchCoaches.isPrimary, true)))
    .limit(1);

  if (primaryCoach) {
    return primaryCoach.coachId;
  }

  const [batchCoach] = await db
    .select({ coachId: batchCoaches.coachId })
    .from(batchCoaches)
    .where(eq(batchCoaches.batchId, batchId))
    .limit(1);

  if (batchCoach) {
    return batchCoach.coachId;
  }

  const [sportCoach] = await db
    .select({ id: coaches.id })
    .from(coaches)
    .where(and(eq(coaches.academyId, academyId), eq(coaches.sportId, sportId)))
    .limit(1);

  if (!sportCoach) {
    throw new Error("No coach is assigned for this batch. Add a coach before marking attendance.");
  }

  return sportCoach.id;
}

export async function getBatchRoster(academyId: string, batchId: string) {
  await assertBatchInAcademy(academyId, batchId);

  const rows = await db
    .select({
      id: players.id,
      fullName: players.fullName,
      avatarColor: players.avatarColor,
    })
    .from(players)
    .where(
      and(
        eq(players.academyId, academyId),
        eq(players.batchId, batchId),
        ne(players.status, "inactive")
      )
    )
    .orderBy(players.fullName);

  return rows.map((row) => ({
    playerId: row.id,
    name: row.fullName,
    initials: getInitials(row.fullName),
    avatarColor: row.avatarColor,
  }));
}

async function findSessionForBatchDate(academyId: string, batchId: string, dateStr: string) {
  const { start, end } = parseDateOnly(dateStr);

  const [session] = await db
    .select()
    .from(trainingSessions)
    .where(
      and(
        eq(trainingSessions.academyId, academyId),
        eq(trainingSessions.batchId, batchId),
        gte(trainingSessions.scheduledAt, start),
        lte(trainingSessions.scheduledAt, end)
      )
    )
    .limit(1);

  return session ?? null;
}

export async function getAttendanceForBatchDate(
  academyId: string,
  batchId: string,
  dateStr: string
): Promise<AttendanceMarkSession> {
  await assertBatchInAcademy(academyId, batchId);
  const roster = await getBatchRoster(academyId, batchId);
  const session = await findSessionForBatchDate(academyId, batchId, dateStr);

  const recordMap = new Map<string, { id: string; status: AttendanceMarkStatus }>();

  if (session) {
    const records = await db
      .select({
        id: attendanceRecords.id,
        playerId: attendanceRecords.playerId,
        status: attendanceRecords.status,
      })
      .from(attendanceRecords)
      .where(eq(attendanceRecords.sessionId, session.id));

    for (const record of records) {
      if (record.status === "present" || record.status === "absent") {
        recordMap.set(record.playerId, { id: record.id, status: record.status });
      }
    }
  }

  const entries = roster.map((player) => {
    const record = recordMap.get(player.playerId);
    return {
      ...player,
      status: record?.status ?? null,
      recordId: record?.id ?? null,
    };
  });

  const presentCount = entries.filter((entry) => entry.status === "present").length;
  const absentCount = entries.filter((entry) => entry.status === "absent").length;

  return {
    sessionId: session?.id ?? null,
    batchId,
    date: dateStr,
    roster: entries,
    presentCount,
    absentCount,
    markedCount: presentCount + absentCount,
    totalPlayers: entries.length,
    isMarked: session?.status === "marked",
  };
}

export async function saveAttendanceRecords(academyId: string, payload: SaveAttendancePayload) {
  const batch = await assertBatchInAcademy(academyId, payload.batchId);
  const roster = await getBatchRoster(academyId, payload.batchId);
  const rosterIds = new Set(roster.map((player) => player.playerId));

  for (const record of payload.records) {
    if (!rosterIds.has(record.playerId)) {
      throw new Error("One or more players are not in this batch roster.");
    }
  }

  const coachId = await resolveCoachForBatch(academyId, payload.batchId, batch.sportId);
  const { start, end } = parseDateOnly(payload.date);

  return db.transaction(async (tx) => {
    let [session] = await tx
      .select()
      .from(trainingSessions)
      .where(
        and(
          eq(trainingSessions.academyId, academyId),
          eq(trainingSessions.batchId, payload.batchId),
          gte(trainingSessions.scheduledAt, start),
          lte(trainingSessions.scheduledAt, end)
        )
      )
      .limit(1);

    if (!session) {
      [session] = await tx
        .insert(trainingSessions)
        .values({
          academyId,
          batchId: payload.batchId,
          coachId,
          sportId: batch.sportId,
          scheduledAt: scheduledAtForDate(payload.date),
          expectedHeadcount: roster.length,
          status: "upcoming",
        })
        .returning();
    }

    for (const record of payload.records) {
      await tx
        .insert(attendanceRecords)
        .values({
          sessionId: session.id,
          playerId: record.playerId,
          status: record.status,
        })
        .onConflictDoUpdate({
          target: [attendanceRecords.sessionId, attendanceRecords.playerId],
          set: {
            status: record.status,
            updatedAt: new Date(),
          },
        });
    }

    const [counts] = await tx
      .select({
        present: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'present')`,
        total: sql<number>`count(*)`,
      })
      .from(attendanceRecords)
      .where(eq(attendanceRecords.sessionId, session.id));

    await tx
      .update(trainingSessions)
      .set({
        status: "marked",
        expectedHeadcount: roster.length,
        sportId: batch.sportId,
        updatedAt: new Date(),
      })
      .where(eq(trainingSessions.id, session.id));

    const present = Number(counts?.present ?? 0);
    const total = Number(counts?.total ?? 0);

    return {
      sessionId: session.id,
      present,
      absent: total - present,
      total,
      rate: total > 0 ? `${Math.round((present / total) * 100)}%` : "—",
    };
  });
}

export async function listBatchAttendanceHistory(
  academyId: string,
  batchId: string
): Promise<BatchAttendanceHistoryEntry[]> {
  await assertBatchInAcademy(academyId, batchId);

  const rows = await db
    .select({
      session: trainingSessions,
      present: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'present')`,
      absent: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'absent')`,
      total: sql<number>`count(*)`,
    })
    .from(trainingSessions)
    .leftJoin(attendanceRecords, eq(attendanceRecords.sessionId, trainingSessions.id))
    .where(and(eq(trainingSessions.academyId, academyId), eq(trainingSessions.batchId, batchId)))
    .groupBy(trainingSessions.id)
    .orderBy(sql`${trainingSessions.scheduledAt} desc`);

  return rows.map((row) => {
    const present = Number(row.present);
    const absent = Number(row.absent);
    const total = Number(row.total);
    const rate = total > 0 ? `${Math.round((present / total) * 100)}%` : "—";
    const date = row.session.scheduledAt.toISOString().slice(0, 10);

    return {
      sessionId: row.session.id,
      date,
      dateLabel: row.session.scheduledAt.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      present,
      absent,
      total,
      rate,
      status: row.session.status,
    };
  });
}

export async function getAttendanceSessions(academyId: string): Promise<AttendanceSession[]> {
  const rows = await db
    .select({
      session: trainingSessions,
      batchId: batches.id,
      batchName: batches.name,
      sportName: sports.name,
      coachName: coaches.fullName,
      present: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'present')`,
      total: sql<number>`count(*)`,
    })
    .from(trainingSessions)
    .leftJoin(batches, eq(trainingSessions.batchId, batches.id))
    .innerJoin(sports, eq(trainingSessions.sportId, sports.id))
    .innerJoin(coaches, eq(trainingSessions.coachId, coaches.id))
    .leftJoin(attendanceRecords, eq(attendanceRecords.sessionId, trainingSessions.id))
    .where(eq(trainingSessions.academyId, academyId))
    .groupBy(
      trainingSessions.id,
      batches.id,
      batches.name,
      sports.name,
      coaches.fullName
    )
    .orderBy(sql`${trainingSessions.scheduledAt} desc`);

  return rows.map((row) => {
    const present = Number(row.present);
    const total = Number(row.total);
    const rate = total > 0 ? `${Math.round((present / total) * 100)}%` : "—";
    const isUpcoming = row.session.status === "upcoming";
    const isLow = total > 0 && present / total < 0.9 && !isUpcoming;

    const timeLabel =
      row.session.scheduledAt.toDateString() === new Date().toDateString()
        ? row.session.scheduledAt.toLocaleTimeString("en-IN", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })
        : row.session.scheduledAt.toDateString() ===
            new Date(Date.now() - 86400000).toDateString()
          ? "Yesterday"
          : row.session.scheduledAt.toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            });

    return {
      id: row.session.id,
      batchId: row.batchId ?? "",
      sportId: row.session.sportId,
      date: row.session.scheduledAt.toISOString().slice(0, 10),
      batch: row.batchName ?? "—",
      sport: row.sportName,
      coach: row.coachName,
      time: timeLabel,
      present,
      total,
      rate,
      status: isUpcoming ? "Upcoming" : isLow ? "Low" : "Marked",
      statusVariant: isUpcoming ? "amber" : isLow ? "red" : "green",
    };
  });
}
