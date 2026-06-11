import { and, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  activityEvents,
  attendanceRecords,
  feePayments,
  feeInvoices,
  players,
  sports,
  trainingSessions,
  tournaments,
} from "@/db/schema";
import { formatPaise } from "@/lib/format";

export async function getDashboardStats(academyId: string) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [playerCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(players)
    .where(and(eq(players.academyId, academyId), eq(players.status, "active")));

  const [feesCollected] = await db
    .select({ total: sql<number>`coalesce(sum(${feePayments.amountPaise}), 0)` })
    .from(feePayments)
    .innerJoin(feeInvoices, eq(feePayments.invoiceId, feeInvoices.id))
    .where(
      and(
        eq(feeInvoices.academyId, academyId),
        gte(feePayments.paidAt, monthStart),
        lte(feePayments.paidAt, monthEnd)
      )
    );

  const [attendance] = await db
    .select({
      present: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'present')`,
      total: sql<number>`count(*)`,
    })
    .from(attendanceRecords)
    .innerJoin(trainingSessions, eq(attendanceRecords.sessionId, trainingSessions.id))
    .where(eq(trainingSessions.academyId, academyId));

  const [upcomingSessions] = await db
    .select({ count: sql<number>`count(*)` })
    .from(trainingSessions)
    .where(and(eq(trainingSessions.academyId, academyId), eq(trainingSessions.status, "upcoming")));

  const [liveTournaments] = await db
    .select({ count: sql<number>`count(*)` })
    .from(tournaments)
    .where(and(eq(tournaments.academyId, academyId), eq(tournaments.status, "live")));

  const avgAttendance =
    attendance?.total && Number(attendance.total) > 0
      ? Math.round((Number(attendance.present) / Number(attendance.total)) * 100)
      : 0;

  const upcomingCount = Number(upcomingSessions?.count ?? 0) + Number(liveTournaments?.count ?? 0);

  return [
    {
      value: String(playerCount?.count ?? 0),
      label: "Active players",
      delta: "+12 this month",
      iconBg: "var(--brand-soft)",
      iconColor: "var(--brand-d)",
      up: true,
    },
    {
      value: formatPaise(Number(feesCollected?.total ?? 0)),
      label: `Fees collected · ${now.toLocaleString("en-IN", { month: "long" })}`,
      delta: "86% of target",
      iconBg: "var(--green-soft)",
      iconColor: "#0E9B72",
      up: true,
    },
    {
      value: `${avgAttendance}%`,
      label: "Avg. attendance",
      delta: "+3% vs May",
      iconBg: "var(--blue-soft)",
      iconColor: "#2756D8",
      up: true,
    },
    {
      value: String(upcomingCount),
      label: "Upcoming events",
      delta: "Next: 12 June",
      iconBg: "var(--purple-soft)",
      iconColor: "#6443E0",
      up: false,
    },
  ];
}

export async function getPlayersBySport(academyId: string) {
  const rows = await db
    .select({
      sport: sports.name,
      color: sports.color,
      count: sql<number>`count(${players.id})`,
    })
    .from(players)
    .innerJoin(sports, eq(players.sportId, sports.id))
    .where(eq(players.academyId, academyId))
    .groupBy(sports.name, sports.color);

  return rows.map((row) => ({
    sport: row.sport,
    color: row.color,
    count: Number(row.count),
  }));
}

export async function getTodaySessions(academyId: string) {
  const rows = await db
    .select({
      session: trainingSessions,
      batchName: sql<string>`coalesce((select name from academy.batches where id = ${trainingSessions.batchId}), '')`,
      coachName: sql<string>`(select full_name from people.coaches where id = ${trainingSessions.coachId})`,
      present: sql<number>`(
        select count(*) from operations.attendance_records ar
        where ar.session_id = ${trainingSessions.id} and ar.status = 'present'
      )`,
      total: sql<number>`(
        select count(*) from operations.attendance_records ar
        where ar.session_id = ${trainingSessions.id}
      )`,
    })
    .from(trainingSessions)
    .where(eq(trainingSessions.academyId, academyId))
    .orderBy(trainingSessions.scheduledAt)
    .limit(5);

  return rows.map((row) => {
    const time = row.session.scheduledAt.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    const isUpcoming = row.session.status === "upcoming";
    const present = Number(row.present);
    const total = Number(row.total);

    return {
      time,
      title: `${row.batchName || "Session"} · ${row.session.venue ?? ""}`.replace(/ · $/, ""),
      coach: `Coach ${row.coachName ?? ""} · ${row.session.venue ?? ""}`,
      pill: isUpcoming
        ? "Starts in 2h"
        : total > 0
          ? `${present}/${total} present`
          : "—",
      pillVariant: isUpcoming ? ("amber" as const) : ("green" as const),
    };
  });
}

export async function getRecentActivity(academyId: string) {
  const rows = await db
    .select()
    .from(activityEvents)
    .where(eq(activityEvents.academyId, academyId))
    .orderBy(sql`${activityEvents.createdAt} desc`)
    .limit(5);

  return rows.map((row) => {
    const meta = (row.metadata ?? {}) as Record<string, unknown>;
    return {
      bold: row.actorName,
      text: row.description,
      time: formatTimeAgo(row.createdAt),
      type: (meta.type as "check" | "video" | "users") ?? "check",
      prefix: Boolean(meta.prefix),
    };
  });
}

function formatTimeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
