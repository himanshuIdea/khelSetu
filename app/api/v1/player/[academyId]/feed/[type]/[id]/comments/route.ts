import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import { getPlayerApiContext, handlePlayerApiError } from "@/lib/auth/player-api-access";
import { addFeedComment, listFeedComments } from "@/lib/repositories/academy-feed";
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

export async function GET(_request: Request, context: RouteContext) {
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

    const comments = await listFeedComments(academyId, itemType, id);
    return NextResponse.json({ comments });
  } catch (error) {
    return handlePlayerApiError(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
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

    const body = (await request.json()) as { body?: string };
    if (!body.body?.trim()) {
      return NextResponse.json({ error: "Comment body is required." }, { status: 400 });
    }

    const comment = await addFeedComment(
      academyId,
      itemType,
      id,
      access.context.userId,
      body.body
    );
    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    return handlePlayerApiError(error);
  }
}
