import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import { getPlayerApiContext, handlePlayerApiError } from "@/lib/auth/player-api-access";
import { listPlayerNotifications } from "@/lib/repositories/player-notifications";

export const runtime = "nodejs";

loadEnv();

type RouteContext = {
  params: Promise<{ academyId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { academyId } = await context.params;
    const access = await getPlayerApiContext(academyId);
    if (!access.ok) {
      return access.response;
    }

    const items = await listPlayerNotifications(academyId, access.context.playerId);
    return NextResponse.json({ items });
  } catch (error) {
    return handlePlayerApiError(error);
  }
}
