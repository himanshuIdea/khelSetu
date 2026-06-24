import { cache } from "react";
import { and, asc, desc, eq, ilike, inArray, isNull, or, sql } from "drizzle-orm";
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
  StateFundBeneficiaryFilters,
  StateFundBeneficiaryListResult,
  StateFundCoachBeneficiaryRow,
  StateFundGrantSummary,
  StateFundNurseryBeneficiaryRow,
  StateFundScheme,
  StateFundsDashboard,
  StateFundSchemeDetail,
  StateFundSchemeHeader,
} from "@/lib/state-portal";
import type { GrantStatusFilter } from "@/lib/state-fund-filters";
import { getAthleteCountByAcademy, getPrimarySportByAcademy, getStateNurseryContext } from "./state-nursery-helpers";
import { cacheStateActiveFiscalYear, revalidateStateActiveFiscalYearCache } from "./state-portal-cache";
import { listStateNurseries } from "./state-nurseries";
import { countDistinctPaidBeneficiariesForFiscalYear } from "./state-fund-disbursements";

type SchemeRow = typeof stateFundSchemes.$inferSelect;

export const DEFAULT_SCHEME_BENEFICIARY_PAGE_SIZE = 100;

const COACH_NIS_LABEL: Record<string, string> = {
  nis_level_1: "NIS Level 1",
  nis_level_2: "NIS Level 2",
  in_review: "In review",
};

const COACH_NIS_FILTER_TO_DB: Record<string, string> = {
  "NIS Level 1": "nis_level_1",
  "NIS Level 2": "nis_level_2",
  "In review": "in_review",
};

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

async function fetchActiveFiscalYearRow() {
  const [row] = await db
    .select()
    .from(stateFiscalYears)
    .where(eq(stateFiscalYears.isActive, true))
    .orderBy(desc(stateFiscalYears.startDate))
    .limit(1);
  return row ?? null;
}

export const getActiveFiscalYear = cache(async () => {
  return cacheStateActiveFiscalYear(fetchActiveFiscalYearRow);
});

export const getFundsHeaderFyMeta = cache(async () => {
  const fy = await getActiveFiscalYear();
  return {
    fiscalYearLabel: fy?.label ?? "2026-27",
    fyTotalAllocatedPaise: fy?.totalAllocatedAmountPaise ?? 0,
  };
});

export const getStateFundsDashboard = cache(async (): Promise<StateFundsDashboard> => {
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
  revalidateStateActiveFiscalYearCache();
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

async function loadGrantMapForScheme(schemeId: string): Promise<Map<string, StateFundGrantSummary>> {
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
    .where(eq(stateFundDisbursements.schemeId, schemeId))
    .orderBy(desc(stateFundDisbursements.createdAt));

  const grantRows = disbursementRows.map((row) => ({
    id: row.id,
    beneficiaryKey: row.playerId ?? row.coachId ?? row.academyId ?? "",
    amountPaise: row.amountPaise,
    status: row.status,
    createdAt: row.createdAt,
  }));

  return latestGrantMap(grantRows);
}

function grantStatusFilterSql(
  schemeId: string,
  grantFilter: GrantStatusFilter | undefined,
  beneficiaryIdColumn: typeof players.id | typeof coaches.id | typeof academies.id
) {
  if (!grantFilter || grantFilter === "all") return undefined;

  const beneficiaryColumn =
    beneficiaryIdColumn === players.id
      ? stateFundDisbursements.playerId
      : beneficiaryIdColumn === coaches.id
        ? stateFundDisbursements.coachId
        : stateFundDisbursements.academyId;

  const latestStatus = sql<string | null>`(
    SELECT ${stateFundDisbursements.status}::text
    FROM ${stateFundDisbursements}
    WHERE ${stateFundDisbursements.schemeId} = ${schemeId}
      AND ${beneficiaryColumn} = ${beneficiaryIdColumn}
    ORDER BY ${stateFundDisbursements.createdAt} DESC
    LIMIT 1
  )`;

  if (grantFilter === "none") {
    return sql`${latestStatus} IS NULL`;
  }

  return sql`${latestStatus} = ${grantFilter}`;
}

export async function getSchemeDetailHeader(slug: string): Promise<StateFundSchemeHeader | null> {
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

  return { scheme: mappedScheme, fiscalYearLabel: fy.label };
}

export async function listSchemeAthleteNurseryNames(): Promise<string[]> {
  const { academyIds } = await getStateNurseryContext();
  if (academyIds.length === 0) return [];

  const rows = await db
    .selectDistinct({ name: academies.name })
    .from(players)
    .innerJoin(academies, eq(players.academyId, academies.id))
    .where(
      and(
        inArray(players.academyId, academyIds),
        inArray(players.status, ["active", "on_hold"]),
        isNull(academies.deletedAt)
      )
    )
    .orderBy(asc(academies.name));

  return rows.map((row) => row.name).filter(Boolean);
}

export async function listSchemeBeneficiariesPage(
  slug: string,
  options: {
    filters?: StateFundBeneficiaryFilters;
    offset?: number;
    limit?: number;
  }
): Promise<StateFundBeneficiaryListResult | null> {
  const scheme = await getSchemeBySlug(slug);
  if (!scheme) return null;

  const filters = options.filters;
  const offset = options.offset ?? 0;
  const limit = options.limit ?? DEFAULT_SCHEME_BENEFICIARY_PAGE_SIZE;
  const grantMap = await loadGrantMapForScheme(scheme.id);
  const { academyIds } = await getStateNurseryContext();

  if (academyIds.length === 0) {
    if (scheme.beneficiaryType === "athlete") {
      return { beneficiaryType: "athlete", items: [], total: 0 };
    }
    if (scheme.beneficiaryType === "coach") {
      return { beneficiaryType: "coach", items: [], total: 0 };
    }
    return { beneficiaryType: "nursery", items: [], total: 0 };
  }

  if (scheme.beneficiaryType === "athlete") {
    const conditions = [
      inArray(players.academyId, academyIds),
      inArray(players.status, ["active", "on_hold"]),
      isNull(academies.deletedAt),
    ];

    if (filters?.district && filters.district !== "all") {
      conditions.push(eq(academies.district, filters.district));
    }

    if (filters?.sport && filters.sport !== "all") {
      conditions.push(eq(sports.name, filters.sport));
    }

    if (filters?.nursery && filters.nursery !== "all") {
      conditions.push(eq(academies.name, filters.nursery));
    }

    const search = filters?.search?.trim();
    if (search) {
      const pattern = `%${search}%`;
      conditions.push(
        or(
          ilike(players.fullName, pattern),
          ilike(players.externalId, pattern),
          ilike(sports.name, pattern),
          ilike(academies.district, pattern),
          ilike(academies.name, pattern)
        )!
      );
    }

    const grantCondition = grantStatusFilterSql(scheme.id, filters?.grant, players.id);
    if (grantCondition) {
      conditions.push(grantCondition);
    }

    const where = and(...conditions);

    const [countRow, rows] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(players)
        .innerJoin(academies, eq(players.academyId, academies.id))
        .innerJoin(sports, eq(players.sportId, sports.id))
        .where(where),
      db
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
        .where(where)
        .orderBy(desc(players.rating), asc(players.id))
        .offset(offset)
        .limit(limit),
    ]);

    const items: StateFundAthleteBeneficiaryRow[] = rows.map((row) => {
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

    return {
      beneficiaryType: "athlete",
      items,
      total: Number(countRow[0]?.count ?? 0),
    };
  }

  if (scheme.beneficiaryType === "coach") {
    const conditions = [
      inArray(coaches.academyId, academyIds),
      isNull(academies.deletedAt),
    ];

    if (filters?.district && filters.district !== "all") {
      conditions.push(eq(academies.district, filters.district));
    }

    if (filters?.sport && filters.sport !== "all") {
      conditions.push(eq(sports.name, filters.sport));
    }

    if (filters?.nis && filters.nis !== "all") {
      const dbValue = COACH_NIS_FILTER_TO_DB[filters.nis];
      if (dbValue) {
        conditions.push(
          eq(coaches.nisLevel, dbValue as "nis_level_1" | "nis_level_2" | "in_review")
        );
      }
    }

    const search = filters?.search?.trim();
    if (search) {
      const pattern = `%${search}%`;
      conditions.push(
        or(
          ilike(coaches.fullName, pattern),
          ilike(coaches.roleTitle, pattern),
          ilike(sports.name, pattern),
          ilike(academies.district, pattern),
          ilike(academies.name, pattern)
        )!
      );
    }

    const grantCondition = grantStatusFilterSql(scheme.id, filters?.grant, coaches.id);
    if (grantCondition) {
      conditions.push(grantCondition);
    }

    const where = and(...conditions);

    const [countRow, rows] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(coaches)
        .innerJoin(academies, eq(coaches.academyId, academies.id))
        .innerJoin(sports, eq(coaches.sportId, sports.id))
        .where(where),
      db
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
        .where(where)
        .orderBy(asc(coaches.fullName), asc(coaches.id))
        .offset(offset)
        .limit(limit),
    ]);

    const items: StateFundCoachBeneficiaryRow[] = rows.map((row) => ({
      id: row.id,
      initials: getInitials(row.fullName),
      name: row.fullName,
      detail: row.roleTitle,
      sport: row.sportName,
      district: row.district,
      nurseryName: row.nurseryName,
      nisLevel: COACH_NIS_LABEL[row.nisLevel] ?? row.nisLevel,
      color: row.avatarColor,
      grant: grantForKey(grantMap, row.id),
    }));

    return {
      beneficiaryType: "coach",
      items,
      total: Number(countRow[0]?.count ?? 0),
    };
  }

  const nurseries = await listStateNurseries();
  const filtered = nurseries.filter((row) => {
    if (filters?.district && filters.district !== "all" && row.district !== filters.district) {
      return false;
    }
    if (filters?.sport && filters.sport !== "all" && row.sportLabel !== filters.sport) {
      return false;
    }
    if (filters?.grant && filters.grant !== "all") {
      const grant = grantForKey(grantMap, row.academyId);
      if (grant.status !== filters.grant) return false;
    }
    const search = filters?.search?.trim();
    if (search) {
      const pattern = search.toLowerCase();
      const haystack = [row.name, row.detail, row.district, row.sportLabel]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(pattern)) return false;
    }
    return true;
  });

  const page = filtered.slice(offset, offset + limit);
  const items: StateFundNurseryBeneficiaryRow[] = page.map((n) => ({
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

  return {
    beneficiaryType: "nursery",
    items,
    total: filtered.length,
  };
}

/** Report export: only beneficiaries with pending/paid disbursements (not full statewide rosters). */
export async function getSchemeReportDetail(slug: string): Promise<StateFundSchemeDetail | null> {
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
    .where(
      and(
        eq(stateFundDisbursements.schemeId, scheme.id),
        inArray(stateFundDisbursements.status, ["pending", "paid"])
      )
    )
    .orderBy(desc(stateFundDisbursements.createdAt));

  const grantRows = disbursementRows.map((row) => ({
    id: row.id,
    beneficiaryKey: row.playerId ?? row.coachId ?? row.academyId ?? "",
    amountPaise: row.amountPaise,
    status: row.status as "pending" | "paid",
    createdAt: row.createdAt,
  }));
  const grantMap = latestGrantMap(grantRows);

  const playerIds = [
    ...new Set(disbursementRows.map((r) => r.playerId).filter((id): id is string => id != null)),
  ];
  const coachIds = [
    ...new Set(disbursementRows.map((r) => r.coachId).filter((id): id is string => id != null)),
  ];
  const nurseryAcademyIds = [
    ...new Set(disbursementRows.map((r) => r.academyId).filter((id): id is string => id != null)),
  ];

  const base = { scheme: mappedScheme, fiscalYearLabel: fy.label };

  if (scheme.beneficiaryType === "athlete") {
    if (playerIds.length === 0) {
      return { ...base, athleteBeneficiaries: [] };
    }

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
      .where(and(inArray(players.id, playerIds), isNull(academies.deletedAt)))
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

    return { ...base, athleteBeneficiaries };
  }

  if (scheme.beneficiaryType === "coach") {
    if (coachIds.length === 0) {
      return { ...base, coachBeneficiaries: [] };
    }

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
      .where(and(inArray(coaches.id, coachIds), isNull(academies.deletedAt)))
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

    return { ...base, coachBeneficiaries };
  }

  if (nurseryAcademyIds.length === 0) {
    return { ...base, nurseryBeneficiaries: [] };
  }

  const nurseryRows = await db
    .select({
      academyId: academies.id,
      name: academies.name,
      initials: academies.initials,
      color: academies.brandColor,
      district: academies.district,
    })
    .from(academies)
    .where(and(inArray(academies.id, nurseryAcademyIds), isNull(academies.deletedAt)));

  const athleteCountByAcademy = await getAthleteCountByAcademy(nurseryAcademyIds);
  const sportByAcademy = await getPrimarySportByAcademy(nurseryAcademyIds);

  const nurseryBeneficiaries: StateFundNurseryBeneficiaryRow[] = nurseryRows.map((row) => ({
    academyId: row.academyId,
    initials: row.initials,
    name: row.name,
    detail: `${row.district} · ${sportByAcademy.get(row.academyId) ?? "Multi-sport"}`,
    district: row.district,
    sportLabel: sportByAcademy.get(row.academyId) ?? "Multi-sport",
    athletes: String(athleteCountByAcademy.get(row.academyId) ?? 0),
    color: row.color,
    grant: grantForKey(grantMap, row.academyId),
  }));

  return { ...base, nurseryBeneficiaries };
}

type ReportDisbursementRow = {
  id: string;
  schemeId: string;
  playerId: string | null;
  coachId: string | null;
  academyId: string | null;
  amountPaise: number;
  status: string;
  createdAt: Date;
};

type ReportBeneficiaryCaches = {
  players: Map<
    string,
    {
      id: string;
      fullName: string;
      externalId: string;
      avatarColor: string;
      weightCategory: string | null;
      sportName: string;
      batchName: string | null;
      district: string | null;
      nurseryName: string;
    }
  >;
  coaches: Map<
    string,
    {
      id: string;
      fullName: string;
      roleTitle: string;
      nisLevel: string;
      avatarColor: string;
      sportName: string;
      district: string | null;
      nurseryName: string;
    }
  >;
  nurseries: Map<
    string,
    {
      academyId: string;
      name: string;
      initials: string;
      color: string;
      district: string | null;
    }
  >;
  athleteCountByAcademy: Map<string, number>;
  sportByAcademy: Map<string, string>;
};

const NIS_LABEL: Record<string, string> = {
  nis_level_1: "NIS Level 1",
  nis_level_2: "NIS Level 2",
  in_review: "In review",
};

async function loadReportBeneficiaryCaches(
  playerIds: string[],
  coachIds: string[],
  nurseryAcademyIds: string[]
): Promise<ReportBeneficiaryCaches> {
  const playerMap = new Map<
    string,
    {
      id: string;
      fullName: string;
      externalId: string;
      avatarColor: string;
      weightCategory: string | null;
      sportName: string;
      batchName: string | null;
      district: string | null;
      nurseryName: string;
    }
  >();
  const coachMap = new Map<
    string,
    {
      id: string;
      fullName: string;
      roleTitle: string;
      nisLevel: string;
      avatarColor: string;
      sportName: string;
      district: string | null;
      nurseryName: string;
    }
  >();
  const nurseryMap = new Map<
    string,
    {
      academyId: string;
      name: string;
      initials: string;
      color: string;
      district: string | null;
    }
  >();

  if (playerIds.length > 0) {
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
      .where(and(inArray(players.id, playerIds), isNull(academies.deletedAt)))
      .orderBy(desc(players.rating));

    for (const row of rows) {
      playerMap.set(row.id, row);
    }
  }

  if (coachIds.length > 0) {
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
      .where(and(inArray(coaches.id, coachIds), isNull(academies.deletedAt)))
      .orderBy(coaches.fullName);

    for (const row of rows) {
      coachMap.set(row.id, row);
    }
  }

  if (nurseryAcademyIds.length > 0) {
    const rows = await db
      .select({
        academyId: academies.id,
        name: academies.name,
        initials: academies.initials,
        color: academies.brandColor,
        district: academies.district,
      })
      .from(academies)
      .where(and(inArray(academies.id, nurseryAcademyIds), isNull(academies.deletedAt)));

    for (const row of rows) {
      nurseryMap.set(row.academyId, row);
    }
  }

  const athleteCountByAcademy =
    nurseryAcademyIds.length > 0
      ? await getAthleteCountByAcademy(nurseryAcademyIds)
      : new Map<string, number>();
  const sportByAcademy =
    nurseryAcademyIds.length > 0
      ? await getPrimarySportByAcademy(nurseryAcademyIds)
      : new Map<string, string>();

  return { players: playerMap, coaches: coachMap, nurseries: nurseryMap, athleteCountByAcademy, sportByAcademy };
}

function buildSchemeReportDetail(
  scheme: SchemeRow,
  fiscalYearLabel: string,
  disbursementRows: ReportDisbursementRow[],
  paidByScheme: Map<string, number>,
  beneficiariesByScheme: Map<string, number>,
  caches: ReportBeneficiaryCaches
): StateFundSchemeDetail {
  const mappedScheme = mapSchemeRow(
    scheme,
    paidByScheme.get(scheme.id) ?? 0,
    beneficiariesByScheme.get(scheme.id) ?? 0
  );

  const grantRows = disbursementRows.map((row) => ({
    id: row.id,
    beneficiaryKey: row.playerId ?? row.coachId ?? row.academyId ?? "",
    amountPaise: row.amountPaise,
    status: row.status as "pending" | "paid",
    createdAt: row.createdAt,
  }));
  const grantMap = latestGrantMap(grantRows);
  const base = { scheme: mappedScheme, fiscalYearLabel };

  if (scheme.beneficiaryType === "athlete") {
    const playerIds = [
      ...new Set(disbursementRows.map((r) => r.playerId).filter((id): id is string => id != null)),
    ];
    const athleteBeneficiaries: StateFundAthleteBeneficiaryRow[] = playerIds
      .map((id) => caches.players.get(id))
      .filter((row): row is NonNullable<typeof row> => row != null)
      .map((row) => {
        const weight = row.weightCategory ? ` · ${row.weightCategory} kg` : "";
        return {
          id: row.id,
          initials: getInitials(row.fullName),
          name: row.fullName,
          detail: row.externalId,
          sport: `${row.sportName}${weight}${row.batchName ? ` · ${row.batchName}` : ""}`,
          district: row.district ?? "—",
          nurseryName: row.nurseryName,
          color: row.avatarColor,
          grant: grantForKey(grantMap, row.id),
        };
      });
    return { ...base, athleteBeneficiaries };
  }

  if (scheme.beneficiaryType === "coach") {
    const coachIds = [
      ...new Set(disbursementRows.map((r) => r.coachId).filter((id): id is string => id != null)),
    ];
    const coachBeneficiaries: StateFundCoachBeneficiaryRow[] = coachIds
      .map((id) => caches.coaches.get(id))
      .filter((row): row is NonNullable<typeof row> => row != null)
      .map((row) => ({
        id: row.id,
        initials: getInitials(row.fullName),
        name: row.fullName,
        detail: row.roleTitle,
        sport: row.sportName,
        district: row.district ?? "—",
        nurseryName: row.nurseryName,
        nisLevel: NIS_LABEL[row.nisLevel] ?? row.nisLevel,
        color: row.avatarColor,
        grant: grantForKey(grantMap, row.id),
      }));
    return { ...base, coachBeneficiaries };
  }

  const nurseryAcademyIds = [
    ...new Set(disbursementRows.map((r) => r.academyId).filter((id): id is string => id != null)),
  ];
  const nurseryBeneficiaries: StateFundNurseryBeneficiaryRow[] = nurseryAcademyIds
    .map((id) => caches.nurseries.get(id))
    .filter((row): row is NonNullable<typeof row> => row != null)
    .map((row) => ({
      academyId: row.academyId,
      initials: row.initials,
      name: row.name,
      detail: `${row.district ?? "—"} · ${caches.sportByAcademy.get(row.academyId) ?? "Multi-sport"}`,
      district: row.district ?? "—",
      sportLabel: caches.sportByAcademy.get(row.academyId) ?? "Multi-sport",
      athletes: String(caches.athleteCountByAcademy.get(row.academyId) ?? 0),
      color: row.color,
      grant: grantForKey(grantMap, row.academyId),
    }));

  return { ...base, nurseryBeneficiaries };
}

/** Batched report export — one stats pass + one disbursements query for all schemes. */
export async function fetchAllSchemeReportDetails(): Promise<StateFundSchemeDetail[]> {
  const fy = await getActiveFiscalYear();
  if (!fy) return [];

  const schemeRows = await db
    .select()
    .from(stateFundSchemes)
    .where(eq(stateFundSchemes.fiscalYearId, fy.id))
    .orderBy(stateFundSchemes.sortOrder);

  if (schemeRows.length === 0) return [];

  const schemeIds = schemeRows.map((scheme) => scheme.id);
  const { paidByScheme, beneficiariesByScheme } = await aggregateSchemeStats(fy.id, schemeIds);

  const allDisbursementRows = await db
    .select({
      id: stateFundDisbursements.id,
      schemeId: stateFundDisbursements.schemeId,
      playerId: stateFundDisbursements.playerId,
      coachId: stateFundDisbursements.coachId,
      academyId: stateFundDisbursements.academyId,
      amountPaise: stateFundDisbursements.amountPaise,
      status: stateFundDisbursements.status,
      createdAt: stateFundDisbursements.createdAt,
    })
    .from(stateFundDisbursements)
    .where(
      and(
        inArray(stateFundDisbursements.schemeId, schemeIds),
        inArray(stateFundDisbursements.status, ["pending", "paid"])
      )
    )
    .orderBy(desc(stateFundDisbursements.createdAt));

  const disbursementsByScheme = new Map<string, ReportDisbursementRow[]>();
  const allPlayerIds = new Set<string>();
  const allCoachIds = new Set<string>();
  const allNurseryIds = new Set<string>();

  for (const row of allDisbursementRows) {
    const list = disbursementsByScheme.get(row.schemeId) ?? [];
    list.push(row);
    disbursementsByScheme.set(row.schemeId, list);
    if (row.playerId) allPlayerIds.add(row.playerId);
    if (row.coachId) allCoachIds.add(row.coachId);
    if (row.academyId) allNurseryIds.add(row.academyId);
  }

  const caches = await loadReportBeneficiaryCaches(
    [...allPlayerIds],
    [...allCoachIds],
    [...allNurseryIds]
  );

  return schemeRows.map((scheme) =>
    buildSchemeReportDetail(
      scheme,
      fy.label,
      disbursementsByScheme.get(scheme.id) ?? [],
      paidByScheme,
      beneficiariesByScheme,
      caches
    )
  );
}

export async function hasFundReportData(): Promise<boolean> {
  const fy = await getActiveFiscalYear();
  if (!fy) return false;

  const allocatedRow = await db
    .select({
      total: sql<number>`coalesce(sum(${stateFundSchemes.allocatedAmountPaise}), 0)`,
    })
    .from(stateFundSchemes)
    .where(eq(stateFundSchemes.fiscalYearId, fy.id));

  if (Number(allocatedRow[0]?.total ?? 0) > 0) return true;

  const pendingRow = await db
    .select({ count: sql<number>`count(*)` })
    .from(stateFundDisbursements)
    .innerJoin(stateFundSchemes, eq(stateFundDisbursements.schemeId, stateFundSchemes.id))
    .where(
      and(
        eq(stateFundSchemes.fiscalYearId, fy.id),
        eq(stateFundDisbursements.status, "pending")
      )
    );

  if (Number(pendingRow[0]?.count ?? 0) > 0) return true;

  const paidRow = await db
    .select({ count: sql<number>`count(*)` })
    .from(stateFundDisbursements)
    .innerJoin(stateFundSchemes, eq(stateFundDisbursements.schemeId, stateFundSchemes.id))
    .where(
      and(
        eq(stateFundSchemes.fiscalYearId, fy.id),
        eq(stateFundDisbursements.status, "paid")
      )
    );

  return Number(paidRow[0]?.count ?? 0) > 0;
}

export async function getSchemeDetailWithBeneficiaries(slug: string): Promise<StateFundSchemeDetail | null> {
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

/** For overview fund utilisation panel — lightweight aggregate (no full dashboard). */
export const listActiveFundSchemeUtilisation = cache(async () => {
  const fy = await getActiveFiscalYear();
  if (!fy) return [];

  const schemeRows = await db
    .select({
      id: stateFundSchemes.id,
      name: stateFundSchemes.name,
      color: stateFundSchemes.color,
      allocatedAmountPaise: stateFundSchemes.allocatedAmountPaise,
    })
    .from(stateFundSchemes)
    .where(eq(stateFundSchemes.fiscalYearId, fy.id))
    .orderBy(stateFundSchemes.sortOrder);

  if (schemeRows.length === 0) return [];

  const schemeIds = schemeRows.map((scheme) => scheme.id);
  const paidRows = await db
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
    .groupBy(stateFundDisbursements.schemeId);

  const paidByScheme = new Map(paidRows.map((row) => [row.schemeId, Number(row.total ?? 0)]));

  return schemeRows
    .map((scheme) => {
      const disbursedPaise = paidByScheme.get(scheme.id) ?? 0;
      const util = utilPercent(disbursedPaise, scheme.allocatedAmountPaise);
      return {
        label: scheme.name,
        value: `${util}%`,
        percent: util,
        color: scheme.color,
        allocatedPaise: scheme.allocatedAmountPaise,
        disbursedPaise,
      };
    })
    .filter((row) => row.allocatedPaise > 0 || row.disbursedPaise > 0)
    .map(({ label, value, percent, color }) => ({ label, value, percent, color }));
});

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
