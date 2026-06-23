import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import { getPlayerApiContext, handlePlayerApiError } from "@/lib/auth/player-api-access";
import { createPlayerSubmission } from "@/lib/repositories/player-submissions";

export const runtime = "nodejs";

loadEnv();

type RouteContext = {
  params: Promise<{ academyId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { academyId } = await context.params;
    const access = await getPlayerApiContext(academyId, { writable: true });
    if (!access.ok) {
      return access.response;
    }

    const body = (await request.json()) as {
      drillName?: string;
      videoUrl?: string;
      drillPostId?: string | null;
      thumbnailGradient?: string | null;
      durationSeconds?: number | null;
    };

    if (!body.drillName?.trim() || !body.videoUrl?.trim()) {
      return NextResponse.json(
        { error: "Drill name and video are required." },
        { status: 400 }
      );
    }

    const submission = await createPlayerSubmission({
      academyId,
      playerId: access.context.playerId,
      drillName: body.drillName,
      videoUrl: body.videoUrl,
      drillPostId: body.drillPostId ?? null,
      thumbnailGradient: body.thumbnailGradient ?? null,
      durationSeconds: body.durationSeconds ?? null,
    });

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    return handlePlayerApiError(error);
  }
}
