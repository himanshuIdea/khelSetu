import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  attendanceRecords,
  batches,
  coaches,
  feeInvoices,
  players,
  sports,
  teamMemberResults,
  teamMembers,
  trainingSessions,
} from "@/db/schema";
import { formatAge, formatDate, formatFeeStatus, formatPaiseFull, getInitials } from "@/lib/format";
import type { Player, PlayerDetail } from "./types";

async function getPlayerAttendanceRate(playerId: string): Promise<string> {
  const [row] = await db
    .select({
      present: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'present')`,
      total: sql<number>`count(*)`,
    })
    .from(attendanceRecords)
    .where(eq(attendanceRecords.playerId, playerId));

  if (!row?.total) return "—";
  return `${Math.round((Number(row.present) / Number(row.total)) * 100)}%`;
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
    .where(eq(players.academyId, academyId));

  const result: Player[] = [];

  for (const row of rows) {
    const [invoice] = await db
      .select()
      .from(feeInvoices)
      .where(eq(feeInvoices.playerId, row.player.id))
      .orderBy(sql`${feeInvoices.period} desc`)
      .limit(1);

    let fee: { label: string; variant: "green" | "red" | "amber" } = {
      label: "—",
      variant: "amber",
    };
    if (invoice) {
      fee = formatFeeStatus(invoice.status, invoice.period);
      if (invoice.status === "due") {
        fee = { label: `Due · ${formatPaiseFull(invoice.amountPaise)}`, variant: "red" };
      } else if (invoice.status === "partial") {
        fee = { label: `Due · ${formatPaiseFull(invoice.amountPaise)}`, variant: "amber" };
      }
    }

    const attendance = await getPlayerAttendanceRate(row.player.id);

    result.push({
      initials: getInitials(row.player.fullName),
      name: row.player.fullName,
      id: row.player.externalId,
      age: formatAge(row.player.dateOfBirth),
      sport: row.sportName,
      weight: row.player.weightCategory ?? "—",
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
    })
    .from(players)
    .innerJoin(sports, eq(players.sportId, sports.id))
    .where(condition)
    .limit(1);

  if (!row) return null;

  const [invoice] = await db
    .select()
    .from(feeInvoices)
    .where(eq(feeInvoices.playerId, row.player.id))
    .orderBy(sql`${feeInvoices.period} desc`)
    .limit(1);

  const [coachRow] = await db
    .select({ name: coaches.fullName })
    .from(trainingSessions)
    .innerJoin(coaches, eq(trainingSessions.coachId, coaches.id))
    .where(eq(trainingSessions.academyId, academyId))
    .limit(1);

  const [wins] = await db
    .select({ count: sql<number>`count(*)` })
    .from(teamMemberResults)
    .innerJoin(teamMembers, eq(teamMemberResults.teamMemberId, teamMembers.id))
    .where(and(eq(teamMembers.playerId, row.player.id), eq(teamMemberResults.result, "W")));

  const attendance = await getPlayerAttendanceRate(row.player.id);

  return {
    initials: getInitials(row.player.fullName),
    name: row.player.fullName,
    id: row.player.externalId,
    sport: `${row.sportName} · ${row.player.weightCategory ?? "—"}`,
    rating: "7.8",
    attendance,
    boutsWon: String(wins?.count ?? 0),
    joined: row.player.joinedAt ? formatDate(row.player.joinedAt) : "—",
    coach: coachRow?.name ?? "—",
    monthlyFee: invoice ? formatPaiseFull(invoice.amountPaise) : "—",
  };
}

export async function getPlayerCounts(academyId: string) {
  const [row] = await db
    .select({
      active: sql<number>`count(*) filter (where ${players.status} = 'active')`,
      onHold: sql<number>`count(*) filter (where ${players.status} = 'on_hold')`,
    })
    .from(players)
    .where(eq(players.academyId, academyId));

  return {
    active: Number(row?.active ?? 0),
    onHold: Number(row?.onHold ?? 0),
  };
}
