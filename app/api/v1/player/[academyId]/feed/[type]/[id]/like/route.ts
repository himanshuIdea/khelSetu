import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import { getPlayerApiContext, handlePlayerApiError } from "@/lib/auth/player-api-access";
import { toggleFeedLike } from "@/lib/repositories/academy-feed";
import type { MediaFeedItemType } from "@/db/schema";

export const runtime = "nodejs";

loadEnv();

type RouteContext = {
  params: Promise<{ academyId: string; type: string; id: string }>;
};

function parseItemType(value: string): MediaFeedItemType | null {
  if (value === "player_submission" || value === "coach_post") {
    return value;
  }
  return null;
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { academyId, type, id } = await context.params;
    const itemType = parseItemType(type);
    if (!itemType) {
      return NextResponse.json({ error: "Invalid feed item type." }, { status: 400 });
    }

    const access = await getPlayerApiContext(academyId);
    if (!access.ok) {
      return access.response;
    }

    const result = await toggleFeedLike(academyId, itemType, id, access.context.userId);
    return NextResponse.json(result);
  } catch (error) {
    return handlePlayerApiError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  return POST(_request, context);
}
