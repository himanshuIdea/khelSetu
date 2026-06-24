import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import {
  assertStateAdminAccess,
  handleStateRouteError,
} from "@/app/api/v1/state/nurseries/_auth";
import { getStateOverview } from "@/lib/repositories/state-aggregates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

loadEnv();

export async function GET() {
  try {
    const auth = await assertStateAdminAccess();
    if ("error" in auth) return auth.error;

    const data = await getStateOverview();
    return NextResponse.json({ data });
  } catch (error) {
    return handleStateRouteError(error);
  }
}
