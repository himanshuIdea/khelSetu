import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import { getCoachApiContext, handleCoachApiError } from "@/lib/auth/coach-api-access";
import { submitDrillReview } from "@/lib/repositories/coach-media";
import type { DrillReviewCriteriaScores } from "@/db/schema";

export const runtime = "nodejs";

loadEnv();

type RouteContext = {
  params: Promise<{ academyId: string; id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { academyId, id } = await context.params;
    const access = await getCoachApiContext(academyId, { writable: true });
    if (!access.ok) {
      return access.response;
    }

    const body = (await request.json()) as {
      rating?: number;
      notes?: string | null;
      criteriaScores?: DrillReviewCriteriaScores | null;
      publishToAcademy?: boolean;
    };

    if (body.rating == null || Number.isNaN(Number(body.rating))) {
      return NextResponse.json({ error: "Rating is required." }, { status: 400 });
    }

    await submitDrillReview(id, access.context.coachId, {
      rating: Number(body.rating),
      notes: body.notes ?? null,
      criteriaScores: body.criteriaScores ?? null,
      publishToAcademy: Boolean(body.publishToAcademy),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleCoachApiError(error);
  }
}
