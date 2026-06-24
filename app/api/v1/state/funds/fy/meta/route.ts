import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import {
  assertStateAdminAccess,
  handleStateRouteError,
} from "@/app/api/v1/state/nurseries/_auth";
import { getFundsHeaderFyMeta } from "@/lib/repositories/state-funds";

export const runtime = "nodejs";

loadEnv();

export async function GET() {
  try {
    const auth = await assertStateAdminAccess();
    if ("error" in auth) return auth.error;

    const meta = await getFundsHeaderFyMeta();
    return NextResponse.json({ meta });
  } catch (error) {
    return handleStateRouteError(error);
  }
}
