import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import {
  assertStateAdminAccess,
  handleStateRouteError,
} from "@/app/api/v1/state/nurseries/_auth";
import { STATE_DEMO_FUNDS_DASHBOARD } from "@/lib/state-demo-funds";

export const runtime = "nodejs";

loadEnv();

export async function GET() {
  try {
    const auth = await assertStateAdminAccess();
    if ("error" in auth) return auth.error;

    // TODO(demo): remove when live funds dashboard is ready for recordings
    const dashboard = STATE_DEMO_FUNDS_DASHBOARD;
    return NextResponse.json({ dashboard });
  } catch (error) {
    return handleStateRouteError(error);
  }
}
