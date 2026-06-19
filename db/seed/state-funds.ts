import { FY_2026_27_LABEL, STATE_FUND_SCHEME_DEFINITIONS } from "@/lib/state-fund-schemes";
import { ensureStateFundsCatalog } from "@/lib/repositories/state-funds-catalog";

/** Ensures FY catalog and empty scheme rows — no demo disbursements. */
export async function seedStateFunds(_stateAdminUserId: string) {
  await ensureStateFundsCatalog();
  console.log(
    `  state funds: FY ${FY_2026_27_LABEL}, ${STATE_FUND_SCHEME_DEFINITIONS.length} schemes (no demo disbursements)`
  );
}
