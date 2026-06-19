import { eq, inArray } from "drizzle-orm";
import { loadEnv } from "@/lib/load-env";
import { db } from "@/lib/db";
import { stateFundDisbursements, stateFundSchemes, stateFiscalYears } from "@/db/schema";
import { FY_2026_27_LABEL } from "@/lib/state-fund-schemes";
import { ensureStateFundsCatalog } from "@/lib/repositories/state-funds-catalog";

loadEnv();

/**
 * One-time dev reset: removes FY 2026-27 disbursements and zeros scheme/FY allocations.
 * Run: `pnpm db:reset-state-funds`
 */
async function main() {
  console.log(`Resetting state funds for FY ${FY_2026_27_LABEL}...`);

  const [fy] = await db
    .select()
    .from(stateFiscalYears)
    .where(eq(stateFiscalYears.label, FY_2026_27_LABEL))
    .limit(1);

  if (fy) {
    const schemes = await db
      .select({ id: stateFundSchemes.id })
      .from(stateFundSchemes)
      .where(eq(stateFundSchemes.fiscalYearId, fy.id));

    const schemeIds = schemes.map((s) => s.id);

    if (schemeIds.length > 0) {
      const deleted = await db
        .delete(stateFundDisbursements)
        .where(inArray(stateFundDisbursements.schemeId, schemeIds))
        .returning({ id: stateFundDisbursements.id });
      console.log(`  deleted ${deleted.length} disbursement(s)`);
    }

    await db
      .update(stateFundSchemes)
      .set({ allocatedAmountPaise: 0, updatedAt: new Date() })
      .where(eq(stateFundSchemes.fiscalYearId, fy.id));

    await db
      .update(stateFiscalYears)
      .set({ totalAllocatedAmountPaise: 0, updatedAt: new Date() })
      .where(eq(stateFiscalYears.id, fy.id));
  } else {
    console.log(`  FY ${FY_2026_27_LABEL} not found — catalog ensure will create it`);
  }

  await ensureStateFundsCatalog();

  console.log("Done. Visit /state/funds to verify zeros.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
