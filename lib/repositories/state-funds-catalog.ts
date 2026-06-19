import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { stateFiscalYears, stateFundSchemes } from "@/db/schema";
import {
  DEFAULT_FY_TOTAL_ALLOCATED_PAISE,
  FY_2026_27_LABEL,
  isLegacySeededSchemeAllocation,
  LEGACY_FY_TOTAL_ALLOCATED_PAISE,
  STATE_FUND_SCHEME_DEFINITIONS,
} from "@/lib/state-fund-schemes";

const FY_START = new Date("2026-04-01T00:00:00.000Z");
const FY_END = new Date("2027-03-31T23:59:59.999Z");

export async function ensureStateFundsCatalog() {
  const [existingFy] = await db
    .select()
    .from(stateFiscalYears)
    .where(eq(stateFiscalYears.label, FY_2026_27_LABEL))
    .limit(1);

  let fiscalYearId = existingFy?.id;

  if (!fiscalYearId) {
    await db.update(stateFiscalYears).set({ isActive: false, updatedAt: new Date() });
    const [created] = await db
      .insert(stateFiscalYears)
      .values({
        label: FY_2026_27_LABEL,
        startDate: FY_START,
        endDate: FY_END,
        isActive: true,
        totalAllocatedAmountPaise: DEFAULT_FY_TOTAL_ALLOCATED_PAISE,
      })
      .returning();
    fiscalYearId = created!.id;
  } else {
    const fyUpdates: {
      isActive: boolean;
      updatedAt: Date;
      totalAllocatedAmountPaise?: number;
    } = { isActive: true, updatedAt: new Date() };

    if (existingFy.totalAllocatedAmountPaise === LEGACY_FY_TOTAL_ALLOCATED_PAISE) {
      fyUpdates.totalAllocatedAmountPaise = DEFAULT_FY_TOTAL_ALLOCATED_PAISE;
    }

    await db.update(stateFiscalYears).set(fyUpdates).where(eq(stateFiscalYears.id, fiscalYearId));
  }

  for (const def of STATE_FUND_SCHEME_DEFINITIONS) {
    const [existing] = await db
      .select()
      .from(stateFundSchemes)
      .where(
        and(eq(stateFundSchemes.fiscalYearId, fiscalYearId), eq(stateFundSchemes.slug, def.slug))
      )
      .limit(1);

    if (existing) {
      const shouldResetAllocation = isLegacySeededSchemeAllocation(
        def.slug,
        existing.allocatedAmountPaise
      );

      await db
        .update(stateFundSchemes)
        .set({
          name: def.name,
          subtitle: def.subtitle,
          beneficiaryType: def.beneficiaryType,
          color: def.color,
          sortOrder: def.sortOrder,
          ...(shouldResetAllocation ? { allocatedAmountPaise: def.defaultAllocatedPaise } : {}),
          updatedAt: new Date(),
        })
        .where(eq(stateFundSchemes.id, existing.id));
    } else {
      await db.insert(stateFundSchemes).values({
        fiscalYearId,
        slug: def.slug,
        name: def.name,
        subtitle: def.subtitle,
        beneficiaryType: def.beneficiaryType,
        allocatedAmountPaise: def.defaultAllocatedPaise,
        color: def.color,
        sortOrder: def.sortOrder,
      });
    }
  }

  return fiscalYearId;
}
