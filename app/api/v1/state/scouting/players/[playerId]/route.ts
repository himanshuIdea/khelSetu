import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import {
  assertStateAdminAccess,
  handleStateRouteError,
} from "@/app/api/v1/state/nurseries/_auth";
import { isScoutingStatus } from "@/lib/scouting-status";
import { updatePlayerScoutingStatus } from "@/lib/repositories/state-scouting";

export const runtime = "nodejs";

loadEnv();

type RouteContext = {
  params: Promise<{ playerId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await assertStateAdminAccess();
    if ("error" in auth) return auth.error;

    const { playerId } = await context.params;
    const body = (await request.json()) as { status?: string | null };

    if (body.status != null && body.status !== "" && !isScoutingStatus(body.status)) {
      return NextResponse.json({ error: "Invalid scouting status." }, { status: 400 });
    }

    const status = body.status == null || body.status === "" ? null : body.status;
    await updatePlayerScoutingStatus(playerId, status);

    return NextResponse.json({ ok: true, playerId, status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed.";
    if (message.includes("not found")) {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return handleStateRouteError(error);
  }
}
