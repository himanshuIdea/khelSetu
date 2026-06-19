import { cache } from "react";
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  academies,
  batches,
  coaches,
  players,
  sports,
  stateFiscalYears,
  stateFundDisbursements,
  stateFundSchemes,
} from "@/db/schema";
import { formatCompactCount, formatStateFundAmount, getInitials } from "@/lib/format";
import type {
  StateFundAthleteBeneficiaryRow,
  StateFundCoachBeneficiaryRow,
  StateFundGrantSummary,
  StateFundNurseryBeneficiaryRow,
  StateFundScheme,
  StateFundsDashboard,
  StateFundSchemeDetail,
} from "@/lib/state-portal";
import { getStateNurseryContext } from "./state-nursery-helpers";
import { listStateNurseries } from "./state-nurseries";
import { ensureStateFundsCatalog } from "./state-funds-catalog";
import { countDistinctPaidBeneficiariesForFiscalYear } from "./state-fund-disbursements";

type SchemeRow = typeof stateFundSchemes.$inferSelect;

function utilPercent(paid: number, allocated: number): number {
  if (allocated <= 0) return 0;
  return Math.round((paid / allocated) * 100);
}

function mapSchemeRow(
  scheme: SchemeRow,
  paidPaise: number,
  beneficiaryCount: number
): StateFundScheme {
  const allocated = scheme.allocatedAmountPaise;
  return {
    id: scheme.id,
    slug: scheme.slug,
    name: scheme.name,
    detail: scheme.subtitle,
    beneficiaryType: scheme.beneficiaryType,
    beneficiaries: formatCompactCount(beneficiaryCount),
    allocated: formatStateFundAmount(allocated),
    allocatedPaise: allocated,
    disbursed: formatStateFundAmount(paidPaise),
    disbursedPaise: paidPaise,
    util: utilPercent(paidPaise, allocated),
    color: scheme.color,
  };
}

async function aggregateSchemeStats(fiscalYearId: string, schemeIds: string[]) {
  if (schemeIds.length === 0) {
    return {
      paidByScheme: new Map<string, number>(),
      beneficiariesByScheme: new Map<string, number>(),
      pendingByScheme: new Map<string, number>(),
    };
  }

  const [paidRows, pendingRows, beneficiaryRows] = await Promise.all([
    db
      .select({
        schemeId: stateFundDisbursements.schemeId,
        total: sql<number>`coalesce(sum(${stateFundDisbursements.amountPaise}), 0)`,
      })
      .from(stateFundDisbursements)
      .where(
        and(
          inArray(stateFundDisbursements.schemeId, schemeIds),
          eq(stateFundDisbursements.status, "paid")
        )
      )
      .groupBy(stateFundDisbursements.schemeId),
    db
      .select({
        schemeId: stateFundDisbursements.schemeId,
        count: sql<number>`count(*)`,
      })
      .from(stateFundDisbursements)
      .where(
        and(
          inArray(stateFundDisbursements.schemeId, schemeIds),
          eq(stateFundDisbursements.status, "pending")
        )
      )
      .groupBy(stateFundDisbursements.schemeId),
    db
      .select({
        schemeId: stateFundDisbursements.schemeId,
        count: sql<number>`count(distinct coalesce(${stateFundDisbursements.playerId}::text, ${stateFundDisbursements.coachId}::text, ${stateFundDisbursements.academyId}::text))`,
      })
      .from(stateFundDisbursements)
      .where(
        and(
          inArray(stateFundDisbursements.schemeId, schemeIds),
          eq(stateFundDisbursements.status, "paid")
        )
      )
      .groupBy(stateFundDisbursements.schemeId),
  ]);

  const paidByScheme = new Map(paidRows.map((r) => [r.schemeId, Number(r.total ?? 0)]));
  const pendingByScheme = new Map(pendingRows.map((r) => [r.schemeId, Number(r.count ?? 0)]));
  const beneficiariesByScheme = new Map(
    beneficiaryRows.map((r) => [r.schemeId, Number(r.count ?? 0)])
  );

  return { paidByScheme, beneficiariesByScheme, pendingByScheme };
}

export const getActiveFiscalYear = cache(async () => {
  const [row] = await db
    .select()
    .from(stateFiscalYears)
    .where(eq(stateFiscalYears.isActive, true))
    .orderBy(desc(stateFiscalYears.startDate))
    .limit(1);
  return row ?? null;
});

export const getStateFundsDashboard = cache(async (): Promise<StateFundsDashboard> => {
  await ensureStateFundsCatalog();

  const fy = await getActiveFiscalYear();
  const empty: StateFundsDashboard = {
    fiscalYearLabel: fy?.label ?? "2026-27",
    totalDisbursed: "₹0",
    totalAllocatedPaise: 0,
    fyTotalAllocatedPaise: fy?.totalAllocatedAmountPaise ?? 0,
    allocationPercent: 0,
    beneficiariesPaid: 0,
    pendingApproval: 0,
    paidOnTimeRate: 0,
    schemes: [],
  };

  if (!fy) return empty;

  const schemeRows = await db
    .select()
    .from(stateFundSchemes)
    .where(eq(stateFundSchemes.fiscalYearId, fy.id))
    .orderBy(stateFundSchemes.sortOrder);

  if (schemeRows.length === 0) return { ...empty, fiscalYearLabel: fy.label };

  const schemeIds = schemeRows.map((s) => s.id);
  const { paidByScheme, beneficiariesByScheme, pendingByScheme } = await aggregateSchemeStats(
    fy.id,
    schemeIds
  );

  const schemes = schemeRows.map((scheme) =>
    mapSchemeRow(
      scheme,
      paidByScheme.get(scheme.id) ?? 0,
      beneficiariesByScheme.get(scheme.id) ?? 0
    )
  );

  const totalPaidPaise = schemes.reduce((sum, s) => sum + s.disbursedPaise, 0);
  const schemeAllocatedPaise = schemes.reduce((sum, s) => sum + s.allocatedPaise, 0);
  const fyTotalAllocatedPaise = fy.totalAllocatedAmountPaise ?? 0;
  const totalAllocatedPaise =
    fyTotalAllocatedPaise > 0 ? fyTotalAllocatedPaise : schemeAllocatedPaise;
  const pendingApproval = [...pendingByScheme.values()].reduce((a, b) => a + b, 0);
  const beneficiariesPaid = await countDistinctPaidBeneficiariesForFiscalYear(fy.id);

  const [onTimeRow, paidCountRow] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(stateFundDisbursements)
      .innerJoin(stateFundSchemes, eq(stateFundDisbursements.schemeId, stateFundSchemes.id))
      .where(
        and(
          eq(stateFundSchemes.fiscalYearId, fy.id),
          eq(stateFundDisbursements.status, "paid"),
          sql`(
            (${stateFundDisbursements.dueDate} IS NOT NULL AND ${stateFundDisbursements.paidAt} <= ${stateFundDisbursements.dueDate})
            OR (${stateFundDisbursements.dueDate} IS NULL AND ${stateFundDisbursements.paidAt} <= ${stateFundDisbursements.createdAt} + interval '30 days')
          )`
        )
      ),
    db
      .select({ count: sql<number>`count(*)` })
      .from(stateFundDisbursements)
      .innerJoin(stateFundSchemes, eq(stateFundDisbursements.schemeId, stateFundSchemes.id))
      .where(
        and(eq(stateFundSchemes.fiscalYearId, fy.id), eq(stateFundDisbursements.status, "paid"))
      ),
  ]);

  const paidCount = Number(paidCountRow[0]?.count ?? 0);
  const onTimeCount = Number(onTimeRow[0]?.count ?? 0);
  const paidOnTimeRate =
    paidCount > 0 ? Math.round((onTimeCount / paidCount) * 1000) / 10 : 0;

  const allocationPercent =
    totalAllocatedPaise > 0
      ? Math.round((totalPaidPaise / totalAllocatedPaise) * 100)
      : 0;

  return {
    fiscalYearLabel: fy.label,
    totalDisbursed: formatStateFundAmount(totalPaidPaise),
    totalAllocatedPaise,
    fyTotalAllocatedPaise,
    allocationPercent,
    beneficiariesPaid,
    pendingApproval,
    paidOnTimeRate,
    schemes,
  };
});

export async function updateSchemeAllocation(schemeId: string, allocatedAmountPaise: number) {
  if (allocatedAmountPaise < 0) {
    throw new Error("Allocation must be zero or positive.");
  }

  const [updated] = await db
    .update(stateFundSchemes)
    .set({ allocatedAmountPaise, updatedAt: new Date() })
    .where(eq(stateFundSchemes.id, schemeId))
    .returning();

  if (!updated) throw new Error("Scheme not found.");
  return updated;
}

export async function updateFiscalYearTotalAllocation(totalAllocatedAmountPaise: number) {
  if (totalAllocatedAmountPaise < 0) {
    throw new Error("Allocation must be zero or positive.");
  }

  const fy = await getActiveFiscalYear();
  if (!fy) throw new Error("No active fiscal year.");

  const [updated] = await db
    .update(stateFiscalYears)
    .set({ totalAllocatedAmountPaise, updatedAt: new Date() })
    .where(eq(stateFiscalYears.id, fy.id))
    .returning();

  if (!updated) throw new Error("Fiscal year not found.");
  return updated;
}

export async function getSchemeBySlug(slug: string) {
  const fy = await getActiveFiscalYear();
  if (!fy) return null;

  const [scheme] = await db
    .select()
    .from(stateFundSchemes)
    .where(and(eq(stateFundSchemes.fiscalYearId, fy.id), eq(stateFundSchemes.slug, slug)))
    .limit(1);

  return scheme ?? null;
}

function latestGrantMap(
  rows: {
    id: string;
    beneficiaryKey: string;
    amountPaise: number;
    status: "pending" | "paid";
    createdAt: Date;
  }[]
) {
  const map = new Map<string, StateFundGrantSummary>();
  const sorted = [...rows].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  for (const row of sorted) {
    if (map.has(row.beneficiaryKey)) continue;
    map.set(row.beneficiaryKey, {
      status: row.status,
      amountPaise: row.amountPaise,
      disbursementId: row.id,
    });
  }
  return map;
}

function grantForKey(map: Map<string, StateFundGrantSummary>, key: string): StateFundGrantSummary {
  return map.get(key) ?? { status: "none", amountPaise: 0, disbursementId: null };
}

export async function getSchemeDetailWithBeneficiaries(slug: string): Promise<StateFundSchemeDetail | null> {
  await ensureStateFundsCatalog();

  const scheme = await getSchemeBySlug(slug);
  if (!scheme) return null;

  const fy = await getActiveFiscalYear();
  if (!fy) return null;

  const { paidByScheme, beneficiariesByScheme } = await aggregateSchemeStats(fy.id, [scheme.id]);
  const mappedScheme = mapSchemeRow(
    scheme,
    paidByScheme.get(scheme.id) ?? 0,
    beneficiariesByScheme.get(scheme.id) ?? 0
  );

  const disbursementRows = await db
    .select({
      id: stateFundDisbursements.id,
      playerId: stateFundDisbursements.playerId,
      coachId: stateFundDisbursements.coachId,
      academyId: stateFundDisbursements.academyId,
      amountPaise: stateFundDisbursements.amountPaise,
      status: stateFundDisbursements.status,
      createdAt: stateFundDisbursements.createdAt,
    })
    .from(stateFundDisbursements)
    .where(eq(stateFundDisbursements.schemeId, scheme.id))
    .orderBy(desc(stateFundDisbursements.createdAt));

  const grantRows = disbursementRows.map((row) => ({
    id: row.id,
    beneficiaryKey: row.playerId ?? row.coachId ?? row.academyId ?? "",
    amountPaise: row.amountPaise,
    status: row.status,
    createdAt: row.createdAt,
  }));
  const grantMap = latestGrantMap(grantRows);

  const { academyIds } = await getStateNurseryContext();
  if (academyIds.length === 0) {
    return {
      scheme: mappedScheme,
      fiscalYearLabel: fy.label,
    };
  }

  if (scheme.beneficiaryType === "athlete") {
    const rows = await db
      .select({
        id: players.id,
        fullName: players.fullName,
        externalId: players.externalId,
        avatarColor: players.avatarColor,
        weightCategory: players.weightCategory,
        sportName: sports.name,
        batchName: batches.name,
        district: academies.district,
        nurseryName: academies.name,
      })
      .from(players)
      .innerJoin(academies, eq(players.academyId, academies.id))
      .innerJoin(sports, eq(players.sportId, sports.id))
      .leftJoin(batches, eq(players.batchId, batches.id))
      .where(
        and(
          inArray(players.academyId, academyIds),
          inArray(players.status, ["active", "on_hold"]),
          isNull(academies.deletedAt)
        )
      )
      .orderBy(desc(players.rating));

    const athleteBeneficiaries: StateFundAthleteBeneficiaryRow[] = rows.map((row) => {
      const weight = row.weightCategory ? ` · ${row.weightCategory} kg` : "";
      return {
        id: row.id,
        initials: getInitials(row.fullName),
        name: row.fullName,
        detail: row.externalId,
        sport: `${row.sportName}${weight}${row.batchName ? ` · ${row.batchName}` : ""}`,
        district: row.district,
        nurseryName: row.nurseryName,
        color: row.avatarColor,
        grant: grantForKey(grantMap, row.id),
      };
    });

    return { scheme: mappedScheme, fiscalYearLabel: fy.label, athleteBeneficiaries };
  }

  if (scheme.beneficiaryType === "coach") {
    const rows = await db
      .select({
        id: coaches.id,
        fullName: coaches.fullName,
        roleTitle: coaches.roleTitle,
        nisLevel: coaches.nisLevel,
        avatarColor: coaches.avatarColor,
        sportName: sports.name,
        district: academies.district,
        nurseryName: academies.name,
      })
      .from(coaches)
      .innerJoin(academies, eq(coaches.academyId, academies.id))
      .innerJoin(sports, eq(coaches.sportId, sports.id))
      .where(and(inArray(coaches.academyId, academyIds), isNull(academies.deletedAt)))
      .orderBy(coaches.fullName);

    const nisLabel: Record<string, string> = {
      nis_level_1: "NIS Level 1",
      nis_level_2: "NIS Level 2",
      in_review: "In review",
    };

    const coachBeneficiaries: StateFundCoachBeneficiaryRow[] = rows.map((row) => ({
      id: row.id,
      initials: getInitials(row.fullName),
      name: row.fullName,
      detail: row.roleTitle,
      sport: row.sportName,
      district: row.district,
      nurseryName: row.nurseryName,
      nisLevel: nisLabel[row.nisLevel] ?? row.nisLevel,
      color: row.avatarColor,
      grant: grantForKey(grantMap, row.id),
    }));

    return { scheme: mappedScheme, fiscalYearLabel: fy.label, coachBeneficiaries };
  }

  const nurseries = await listStateNurseries();
  const nurseryBeneficiaries: StateFundNurseryBeneficiaryRow[] = nurseries.map((n) => ({
    academyId: n.academyId,
    initials: n.initials,
    name: n.name,
    detail: n.detail,
    district: n.district,
    sportLabel: n.sportLabel,
    athletes: String(n.athleteCount),
    color: n.color,
    grant: grantForKey(grantMap, n.academyId),
  }));

  return { scheme: mappedScheme, fiscalYearLabel: fy.label, nurseryBeneficiaries };
}

/** For overview fund utilisation panel — only schemes with allocation or disbursement. */
export async function listActiveFundSchemeUtilisation() {
  const dashboard = await getStateFundsDashboard();
  return dashboard.schemes
    .filter((scheme) => scheme.allocatedPaise > 0 || scheme.disbursedPaise > 0)
    .map((scheme) => ({
      label: scheme.name,
      value: `${scheme.util}%`,
      percent: scheme.util,
      color: scheme.color,
    }));
}

export async function getTotalStateFundDisbursedPaise() {
  const fy = await getActiveFiscalYear();
  if (!fy) return 0;

  const [row] = await db
    .select({
      total: sql<number>`coalesce(sum(${stateFundDisbursements.amountPaise}), 0)`,
    })
    .from(stateFundDisbursements)
    .innerJoin(stateFundSchemes, eq(stateFundDisbursements.schemeId, stateFundSchemes.id))
    .where(
      and(eq(stateFundSchemes.fiscalYearId, fy.id), eq(stateFundDisbursements.status, "paid"))
    );

  return Number(row?.total ?? 0);
}
