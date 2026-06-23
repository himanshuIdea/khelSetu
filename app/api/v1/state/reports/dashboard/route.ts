import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import {
  assertStateAdminAccess,
  handleStateRouteError,
} from "@/app/api/v1/state/nurseries/_auth";
import { loadReportsPageData } from "@/lib/repositories/state-reports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

loadEnv();

export async function GET() {
  try {
    const auth = await assertStateAdminAccess();
    if ("error" in auth) return auth.error;

    const { dashboard } = await loadReportsPageData();
    return NextResponse.json({ dashboard });
  } catch (error) {
    return handleStateRouteError(error);
  }
}
