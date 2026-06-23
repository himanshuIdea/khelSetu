import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import { getPlayerApiContext, handlePlayerApiError } from "@/lib/auth/player-api-access";
import { setPlayerFollow } from "@/lib/repositories/academy-feed";

export const runtime = "nodejs";

loadEnv();

type RouteContext = {
  params: Promise<{ academyId: string; playerId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { academyId, playerId } = await context.params;
    const access = await getPlayerApiContext(academyId, { writable: true });
    if (!access.ok) {
      return access.response;
    }

    await setPlayerFollow(academyId, access.context.playerId, playerId, true);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handlePlayerApiError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { academyId, playerId } = await context.params;
    const access = await getPlayerApiContext(academyId, { writable: true });
    if (!access.ok) {
      return access.response;
    }

    await setPlayerFollow(academyId, access.context.playerId, playerId, false);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handlePlayerApiError(error);
  }
}
