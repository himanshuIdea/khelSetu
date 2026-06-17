import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import { getCoachApiContext, handleCoachApiError } from "@/lib/auth/coach-api-access";
import { createCoachDrillPost } from "@/lib/repositories/coach-media";

export const runtime = "nodejs";

loadEnv();

type RouteContext = {
  params: Promise<{ academyId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { academyId } = await context.params;
    const access = await getCoachApiContext(academyId);
    if (!access.ok) {
      return access.response;
    }

    const body = (await request.json()) as {
      sportId?: string;
      batchId?: string | null;
      drillName?: string;
      description?: string | null;
      videoUrl?: string;
      thumbnailGradient?: string | null;
      durationSeconds?: number | null;
    };

    if (!body.sportId || !body.drillName?.trim() || !body.videoUrl?.trim()) {
      return NextResponse.json(
        { error: "Sport, drill name, and video are required." },
        { status: 400 }
      );
    }

    const post = await createCoachDrillPost({
      academyId,
      coachId: access.context.coachId,
      sportId: body.sportId,
      batchId: body.batchId ?? null,
      drillName: body.drillName.trim(),
      description: body.description ?? null,
      videoUrl: body.videoUrl.trim(),
      thumbnailGradient: body.thumbnailGradient ?? null,
      durationSeconds: body.durationSeconds ?? null,
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    return handleCoachApiError(error);
  }
}
