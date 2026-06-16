import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import type { FeeBillingFilters, RecordFeePaymentPayload } from "@/lib/fees";
import { currentFeePeriod, formatPaiseFull, formatPeriod, getInitials } from "@/lib/format";
import {
  batches,
  feeInvoices,
  feePayments,
  players,
  sports,
  academySports,
} from "@/db/schema";
import type { PlayerFeeBillingRow } from "./types";
import { recordActivityEvent } from "@/lib/repositories/activity";

function isOverdue(invoice: { status: string; dueDate: Date | null }): boolean {
  if (invoice.status === "paid") return false;
  if (!invoice.dueDate) return false;
  return invoice.dueDate.getTime() < Date.now();
}

function mapStatus(
  status: string,
  dueDate: Date | null
): { status: PlayerFeeBillingRow["status"]; label: string; variant: PlayerFeeBillingRow["statusVariant"] } {
  if (status === "paid") {
    return { status: "paid", label: "Paid", variant: "green" };
  }
  if (isOverdue({ status, dueDate })) {
    return { status: "overdue", label: "Overdue", variant: "red" };
  }
  if (status === "partial") {
    return { status: "partial", label: "Partial", variant: "amber" };
  }
  return { status: "due", label: "Due", variant: "amber" };
}

export async function getFeeBillingStats(academyId: string) {
  const period = currentFeePeriod();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const invoices = await db
    .select({
      amountPaise: feeInvoices.amountPaise,
      status: feeInvoices.status,
      dueDate: feeInvoices.dueDate,
      period: feeInvoices.period,
    })
    .from(feeInvoices)
    .where(eq(feeInvoices.academyId, academyId));

  let collectedThisMonth = 0;
  let outstandingTotal = 0;
  let overdueCount = 0;
  const playersWithDue = new Set<string>();

  for (const invoice of invoices) {
    const mapped = mapStatus(invoice.status, invoice.dueDate);
    if (invoice.period === period && invoice.status === "paid") {
      collectedThisMonth += invoice.amountPaise;
    }
    if (mapped.status === "due" || mapped.status === "partial" || mapped.status === "overdue") {
      outstandingTotal += invoice.amountPaise;
      if (mapped.status === "overdue") {
        overdueCount += 1;
      }
    }
  }

  const dueInvoices = await db
    .select({ playerId: feeInvoices.playerId })
    .from(feeInvoices)
    .where(
      and(eq(feeInvoices.academyId, academyId), inArray(feeInvoices.status, ["due", "partial"]))
    );

  for (const row of dueInvoices) {
    playersWithDue.add(row.playerId);
  }

  return [
    {
      value: formatPaiseFull(collectedThisMonth),
      label: "Collected this month",
      iconBg: "var(--green-soft)",
      iconColor: "#0E9B72",
      icon: "cash" as const,
    },
    {
      value: formatPaiseFull(outstandingTotal),
      label: "Outstanding total",
      iconBg: "var(--amber-soft)",
      iconColor: "#C77F12",
      icon: "clock" as const,
    },
    {
      value: String(overdueCount),
      label: "Overdue invoices",
      iconBg: "var(--red-soft)",
      iconColor: "#E11D48",
      icon: "alert" as const,
    },
    {
      value: String(playersWithDue.size),
      label: "Players with due fees",
      iconBg: "var(--brand-soft)",
      iconColor: "var(--brand-d)",
      icon: "users" as const,
    },
  ];
}

export async function listPlayerFeeBilling(
  academyId: string,
  filters: FeeBillingFilters = {}
): Promise<PlayerFeeBillingRow[]> {
  const conditions = [eq(feeInvoices.academyId, academyId)];

  if (filters.sportId) {
    conditions.push(eq(players.sportId, filters.sportId));
  }
  if (filters.batchId) {
    conditions.push(eq(players.batchId, filters.batchId));
  }

  const rows = await db
    .select({
      invoice: feeInvoices,
      player: players,
      sportName: sports.name,
      batchName: batches.name,
    })
    .from(feeInvoices)
    .innerJoin(players, eq(feeInvoices.playerId, players.id))
    .innerJoin(sports, eq(players.sportId, sports.id))
    .leftJoin(batches, eq(players.batchId, batches.id))
    .where(and(...conditions))
    .orderBy(desc(feeInvoices.period), players.fullName);

  return rows
    .map((row) => {
      const mapped = mapStatus(row.invoice.status, row.invoice.dueDate);
      const sportBatch = row.batchName
        ? `${row.sportName} · ${row.batchName}`
        : row.sportName;

      return {
        id: row.invoice.id,
        playerId: row.player.id,
        playerName: row.player.fullName,
        initials: getInitials(row.player.fullName),
        avatarColor: row.player.avatarColor,
        sportBatch,
        period: row.invoice.period,
        amountPaise: row.invoice.amountPaise,
        amountLabel: formatPaiseFull(row.invoice.amountPaise),
        status: mapped.status,
        statusLabel: mapped.label,
        statusVariant: mapped.variant,
        sportId: row.player.sportId,
        batchId: row.player.batchId,
      };
    })
    .filter((row) => {
      if (!filters.status || filters.status === "all") return true;
      if (filters.status === "overdue") return row.status === "overdue";
      if (filters.status === "paid") return row.status === "paid";
      if (filters.status === "due") return row.status === "due" || row.status === "partial";
      return true;
    });
}

export async function recordFeePayment(academyId: string, payload: RecordFeePaymentPayload) {
  const [invoiceRow] = await db
    .select({
      invoice: feeInvoices,
      playerName: players.fullName,
    })
    .from(feeInvoices)
    .innerJoin(players, eq(feeInvoices.playerId, players.id))
    .where(and(eq(feeInvoices.id, payload.invoiceId), eq(feeInvoices.academyId, academyId)))
    .limit(1);

  if (!invoiceRow) {
    throw new Error("Invoice not found.");
  }

  const invoice = invoiceRow.invoice;

  if (invoice.status === "paid") {
    throw new Error("This invoice is already paid.");
  }

  const paidAt = payload.paidAt ? new Date(payload.paidAt) : new Date();

  const result = await db.transaction(async (tx) => {
    await tx.insert(feePayments).values({
      invoiceId: invoice.id,
      amountPaise: payload.amountPaise,
      paidAt,
      method: payload.method,
    });

    await tx
      .update(feeInvoices)
      .set({
        status: "paid",
        paidThroughPeriod: invoice.period,
        updatedAt: new Date(),
      })
      .where(eq(feeInvoices.id, invoice.id));

    return { invoiceId: invoice.id };
  });

  const periodLabel = formatPeriod(invoice.period);
  await recordActivityEvent({
    academyId,
    eventType: "fee_paid",
    actorName: invoiceRow.playerName,
    description: `paid ${periodLabel} fees — ${formatPaiseFull(payload.amountPaise)}`,
    metadata: { type: "check" },
  });

  return result;
}

export async function generateInvoicesForPeriod(academyId: string, period?: string) {
  const targetPeriod = period ?? currentFeePeriod();

  const activePlayers = await db
    .select({
      id: players.id,
      monthlyFeePaise: players.monthlyFeePaise,
    })
    .from(players)
    .where(and(eq(players.academyId, academyId), eq(players.status, "active")));

  let created = 0;
  let skipped = 0;

  for (const player of activePlayers) {
    if (player.monthlyFeePaise == null || player.monthlyFeePaise <= 0) {
      skipped += 1;
      continue;
    }

    const [existing] = await db
      .select({ id: feeInvoices.id })
      .from(feeInvoices)
      .where(and(eq(feeInvoices.playerId, player.id), eq(feeInvoices.period, targetPeriod)))
      .limit(1);

    if (existing) {
      skipped += 1;
      continue;
    }

    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + 1);
    dueDate.setDate(5);

    await db.insert(feeInvoices).values({
      playerId: player.id,
      academyId,
      period: targetPeriod,
      amountPaise: player.monthlyFeePaise,
      status: "due",
      dueDate,
    });
    created += 1;
  }

  return { period: targetPeriod, created, skipped };
}

export async function getFeeFormOptions(academyId: string) {
  const sportRows = await db
    .select({ id: sports.id, name: sports.name })
    .from(academySports)
    .innerJoin(sports, eq(academySports.sportId, sports.id))
    .where(eq(academySports.academyId, academyId));

  const batchRows = await db
    .select({ id: batches.id, name: batches.name, sportId: batches.sportId })
    .from(batches)
    .where(eq(batches.academyId, academyId));

  return {
    sports: sportRows,
    batches: batchRows,
  };
}
