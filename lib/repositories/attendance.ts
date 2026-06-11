import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  attendanceRecords,
  batches,
  coaches,
  sports,
  trainingSessions,
} from "@/db/schema";
import type { AttendanceSession } from "./types";

export async function getAttendanceSessions(academyId: string): Promise<AttendanceSession[]> {
  const rows = await db
    .select({
      session: trainingSessions,
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
