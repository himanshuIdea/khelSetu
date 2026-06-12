import { and, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  activityEvents,
  attendanceRecords,
  batches,
  coaches,
  feePayments,
  feeInvoices,
  feeTargets,
  players,
  sports,
  trainingSessions,
  tournaments,
} from "@/db/schema";
import { formatPaise, formatPeriod } from "@/lib/format";

export type FeeTrendPoint = {
  label: string;
  amountPaise: number;
  amountLakh: number;
};

export type FeeTrendChart = {
  coords: { x: number; y: number; label: string }[];
  linePath: string;
  areaPath: string;
  yLabels: string[];
};

export async function getDashboardData(academyId: string) {
  const [stats, playersBySport, todaySessions, recentActivity, feeTrend] = await Promise.all([
    getDashboardStats(academyId),
    getPlayersBySport(academyId),
    getTodaySessions(academyId),
    getRecentActivity(academyId),
    getFeeCollectionTrend(academyId),
  ]);

  return { stats, playersBySport, todaySessions, recentActivity, feeTrend };
}

export async function getDashboardStats(academyId: string) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [playerCount, newThisMonth] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(players)
      .where(and(eq(players.academyId, academyId), eq(players.status, "active")))
      .then(([row]) => Number(row?.count ?? 0)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(players)
      .where(
        and(
          eq(players.academyId, academyId),
          eq(players.status, "active"),
          gte(players.createdAt, monthStart),
          lte(players.createdAt, monthEnd)
        )
      )
      .then(([row]) => Number(row?.count ?? 0)),
  ]);

  const [feesCollected, attendanceThisMonth, attendancePrevMonth, upcomingSessions, liveTournaments, nextSession, nextTournament] =
    await Promise.all([
      db
        .select({ total: sql<number>`coalesce(sum(${feePayments.amountPaise}), 0)` })
        .from(feePayments)
        .innerJoin(feeInvoices, eq(feePayments.invoiceId, feeInvoices.id))
        .where(
          and(
            eq(feeInvoices.academyId, academyId),
            gte(feePayments.paidAt, monthStart),
            lte(feePayments.paidAt, monthEnd)
          )
        )
        .then(([row]) => Number(row?.total ?? 0)),
      getMonthlyAttendanceRate(academyId, monthStart, monthEnd),
      getMonthlyAttendanceRate(academyId, prevMonthStart, prevMonthEnd),
      db
        .select({ count: sql<number>`count(*)` })
        .from(trainingSessions)
        .where(and(eq(trainingSessions.academyId, academyId), eq(trainingSessions.status, "upcoming")))
        .then(([row]) => Number(row?.count ?? 0)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(tournaments)
        .where(and(eq(tournaments.academyId, academyId), eq(tournaments.status, "live")))
        .then(([row]) => Number(row?.count ?? 0)),
      db
        .select({ scheduledAt: trainingSessions.scheduledAt })
        .from(trainingSessions)
        .where(
          and(eq(trainingSessions.academyId, academyId), gte(trainingSessions.scheduledAt, now))
        )
        .orderBy(trainingSessions.scheduledAt)
        .limit(1)
        .then(([row]) => row?.scheduledAt ?? null),
      db
        .select({ startDate: tournaments.startDate })
        .from(tournaments)
        .where(
          and(
            eq(tournaments.academyId, academyId),
            gte(tournaments.startDate, now),
            sql`${tournaments.status} in ('draft', 'live')`
          )
        )
        .orderBy(tournaments.startDate)
        .limit(1)
        .then(([row]) => row?.startDate ?? null),
    ]);

  const attendanceDelta = attendanceThisMonth - attendancePrevMonth;
  const attendanceDeltaLabel =
    attendancePrevMonth > 0 || attendanceThisMonth > 0
      ? `${attendanceDelta >= 0 ? "+" : ""}${attendanceDelta}% vs ${prevMonthStart.toLocaleString("en-IN", { month: "short" })}`
      : "No sessions yet";

  const upcomingCount = upcomingSessions + liveTournaments;
  const nextEventDate = [nextSession, nextTournament]
    .filter((date): date is Date => date != null)
    .sort((a, b) => a.getTime() - b.getTime())[0];
  const nextEventLabel = nextEventDate
    ? `Next: ${nextEventDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
    : "None scheduled";

  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [feeTarget] = await db
    .select()
    .from(feeTargets)
    .where(and(eq(feeTargets.academyId, academyId), eq(feeTargets.period, period)))
    .limit(1);

  const targetPaise = feeTarget?.targetPaise ?? 0;
  const feeProgress =
    targetPaise > 0 ? `${Math.round((feesCollected / targetPaise) * 100)}% of target` : "No target set";

  const playerDelta =
    newThisMonth > 0
      ? `+${newThisMonth} this month`
      : `${playerCount} enrolled`;

  return [
    {
      value: String(playerCount),
      label: "Active players",
      delta: playerDelta,
      iconBg: "var(--brand-soft)",
      iconColor: "var(--brand-d)",
      up: newThisMonth > 0 || playerCount > 0,
    },
    {
      value: formatPaise(feesCollected),
      label: `Fees collected · ${now.toLocaleString("en-IN", { month: "long" })}`,
      delta: feeProgress,
      iconBg: "var(--green-soft)",
      iconColor: "#0E9B72",
      up: targetPaise === 0 || feesCollected >= targetPaise * 0.8,
    },
    {
      value: `${attendanceThisMonth}%`,
      label: "Avg. attendance",
      delta: attendanceDeltaLabel,
      iconBg: "var(--blue-soft)",
      iconColor: "#2756D8",
      up: attendanceDelta >= 0,
    },
    {
      value: String(upcomingCount),
      label: "Upcoming events",
      delta: nextEventLabel,
      iconBg: "var(--purple-soft)",
      iconColor: "#6443E0",
      up: false,
    },
  ];
}

export async function getFeeCollectionTrend(academyId: string): Promise<FeeTrendPoint[]> {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const rows = await db
    .select({
      period: sql<string>`to_char(date_trunc('month', ${feePayments.paidAt}), 'YYYY-MM')`,
      total: sql<number>`coalesce(sum(${feePayments.amountPaise}), 0)`,
    })
    .from(feePayments)
    .innerJoin(feeInvoices, eq(feePayments.invoiceId, feeInvoices.id))
    .where(and(eq(feeInvoices.academyId, academyId), gte(feePayments.paidAt, sixMonthsAgo)))
    .groupBy(sql`date_trunc('month', ${feePayments.paidAt})`)
    .orderBy(sql`date_trunc('month', ${feePayments.paidAt})`);

  const totalsByPeriod = new Map(rows.map((row) => [row.period, Number(row.total)]));

  const points: FeeTrendPoint[] = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const period = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;
    const amountPaise = totalsByPeriod.get(period) ?? 0;
    points.push({
      label: formatPeriod(period),
      amountPaise,
      amountLakh: amountPaise / 100 / 100000,
    });
  }

  return points;
}

export function buildFeeTrendChart(points: FeeTrendPoint[]): FeeTrendChart {
  const chartLeft = 64;
  const chartRight = 540;
  const chartTop = 40;
  const chartBottom = 146;
  const maxLakh = Math.max(...points.map((p) => p.amountLakh), 0.5);
  const scaleMax = Math.ceil(maxLakh * 2) / 2;
  const yLabels = [scaleMax, scaleMax * 0.75, scaleMax * 0.5, scaleMax * 0.25].map((v) =>
    v.toFixed(1)
  );
  const step = points.length > 1 ? (chartRight - chartLeft) / (points.length - 1) : 0;

  const coords = points.map((p, i) => ({
    x: chartLeft + i * step,
    y: chartBottom - (p.amountLakh / scaleMax) * (chartBottom - chartTop),
    label: p.label,
  }));

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x} ${c.y}`).join(" ");
  const areaPath =
    coords.length > 0
      ? `${linePath} L${coords[coords.length - 1].x} ${chartBottom} L${coords[0].x} ${chartBottom} Z`
      : "";

  return { coords, linePath, areaPath, yLabels };
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
    .where(and(eq(players.academyId, academyId), eq(players.status, "active")))
    .groupBy(sports.name, sports.color)
    .orderBy(sql`count(${players.id}) desc`);

  return rows.map((row) => ({
    sport: row.sport,
    color: row.color,
    count: Number(row.count),
  }));
}

export async function getTodaySessions(academyId: string) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

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
    .where(
      and(
        eq(trainingSessions.academyId, academyId),
        gte(trainingSessions.scheduledAt, todayStart),
        lte(trainingSessions.scheduledAt, todayEnd)
      )
    )
    .groupBy(trainingSessions.id, batches.name, sports.name, coaches.fullName)
    .orderBy(trainingSessions.scheduledAt);

  return rows.map((row) => {
    const time = row.session.scheduledAt.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    const isUpcoming = row.session.status === "upcoming";
    const present = Number(row.present);
    const total = Number(row.total);
    const venue = row.session.venue?.trim();

    return {
      id: row.session.id,
      time,
      title: [row.sportName, row.batchName].filter(Boolean).join(" · "),
      coach: venue ? `Coach ${row.coachName} · ${venue}` : `Coach ${row.coachName}`,
      pill: isUpcoming
        ? formatStartsIn(row.session.scheduledAt)
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
      id: row.id,
      bold: row.actorName,
      text: row.description,
      time: formatTimeAgo(row.createdAt),
      type: (meta.type as "check" | "video" | "users") ?? "check",
      prefix: Boolean(meta.prefix),
    };
  });
}

async function getMonthlyAttendanceRate(academyId: string, start: Date, end: Date) {
  const [row] = await db
    .select({
      present: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'present')`,
      total: sql<number>`count(*)`,
    })
    .from(attendanceRecords)
    .innerJoin(trainingSessions, eq(attendanceRecords.sessionId, trainingSessions.id))
    .where(
      and(
        eq(trainingSessions.academyId, academyId),
        gte(trainingSessions.scheduledAt, start),
        lte(trainingSessions.scheduledAt, end)
      )
    );

  if (!row?.total || Number(row.total) === 0) return 0;
  return Math.round((Number(row.present) / Number(row.total)) * 100);
}

function formatStartsIn(scheduledAt: Date): string {
  const diffMs = scheduledAt.getTime() - Date.now();
  if (diffMs <= 0) return "Starting now";
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `Starts in ${mins} min`;
  const hours = Math.round(mins / 60);
  return `Starts in ${hours}h`;
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
