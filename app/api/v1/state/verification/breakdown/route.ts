import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import {
  assertStateAdminAccess,
  handleStateRouteError,
} from "@/app/api/v1/state/nurseries/_auth";
import { getVerificationBreakdown } from "@/lib/repositories/state-aggregates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

loadEnv();

export async function GET() {
  try {
    const auth = await assertStateAdminAccess();
    if ("error" in auth) return auth.error;

    const breakdown = await getVerificationBreakdown();
    return NextResponse.json({ breakdown });
  } catch (error) {
    return handleStateRouteError(error);
  }
}
