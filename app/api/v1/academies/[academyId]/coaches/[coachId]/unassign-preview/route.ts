import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import { validateUnassignPayload, type UnassignPayload } from "@/lib/coaches";
import { previewUnassignPlayers } from "@/lib/repositories/coaches";
import {
  assertAcademyCoachAccess,
  handleCoachRouteError,
} from "@/app/api/v1/academies/[academyId]/coaches/_auth";

export const runtime = "nodejs";

loadEnv();

type RouteContext = {
  params: Promise<{ academyId: string; coachId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { academyId, coachId } = await context.params;
    const accessError = await assertAcademyCoachAccess(academyId);
    if (accessError) return accessError;

    const { searchParams } = new URL(request.url);
    const payload: UnassignPayload = {
      scope: searchParams.get("scope") as UnassignPayload["scope"],
      sportId: searchParams.get("sportId") ?? undefined,
      batchId: searchParams.get("batchId") ?? undefined,
    };

    const validationError = validateUnassignPayload(payload);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const preview = await previewUnassignPlayers(academyId, coachId, payload);
    return NextResponse.json(preview);
  } catch (error) {
    return handleCoachRouteError(error);
  }
}
