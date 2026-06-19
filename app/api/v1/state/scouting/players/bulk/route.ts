import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import {
  assertStateAdminAccess,
  handleStateRouteError,
} from "@/app/api/v1/state/nurseries/_auth";
import { isScoutingStatus } from "@/lib/scouting-status";
import { bulkUpdatePlayerScoutingStatus } from "@/lib/repositories/state-scouting";

export const runtime = "nodejs";

loadEnv();

export async function PATCH(request: Request) {
  try {
    const auth = await assertStateAdminAccess();
    if ("error" in auth) return auth.error;

    const body = (await request.json()) as { playerIds?: string[]; status?: string };

    if (!Array.isArray(body.playerIds) || body.playerIds.length === 0) {
      return NextResponse.json({ error: "playerIds is required." }, { status: 400 });
    }

    if (!body.status || !isScoutingStatus(body.status)) {
      return NextResponse.json({ error: "Valid scouting status is required." }, { status: 400 });
    }

    const updated = await bulkUpdatePlayerScoutingStatus(body.playerIds, body.status);

    return NextResponse.json({ ok: true, updated, status: body.status });
  } catch (error) {
    return handleStateRouteError(error);
  }
}
