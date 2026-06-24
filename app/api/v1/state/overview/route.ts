import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import {
  assertStateAdminAccess,
  handleStateRouteError,
} from "@/app/api/v1/state/nurseries/_auth";
import { getCachedStateOverview } from "@/lib/repositories/state-aggregates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

loadEnv();

export async function GET() {
  const startedAt = Date.now();

  try {
    const auth = await assertStateAdminAccess();
    if ("error" in auth) return auth.error;

    const data = await getCachedStateOverview();
    const durationMs = Date.now() - startedAt;

    return NextResponse.json(
      { data },
      {
        headers: {
          "X-State-Timing-Ms": String(durationMs),
          "Cache-Control": "private, max-age=30",
        },
      }
    );
  } catch (error) {
    return handleStateRouteError(error);
  }
}
