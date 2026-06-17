import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import { getCoachApiContext, handleCoachApiError } from "@/lib/auth/coach-api-access";
import { getCoachPlayerDetail } from "@/lib/repositories/players";

export const runtime = "nodejs";

loadEnv();

type RouteContext = {
  params: Promise<{ academyId: string; externalId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { academyId, externalId } = await context.params;
    const access = await getCoachApiContext(academyId);
    if (!access.ok) {
      return access.response;
    }

    const player = await getCoachPlayerDetail(academyId, access.context.coachId, externalId);
    if (!player) {
      return NextResponse.json({ error: "Player not found." }, { status: 404 });
    }

    return NextResponse.json(player);
  } catch (error) {
    return handleCoachApiError(error);
  }
}
