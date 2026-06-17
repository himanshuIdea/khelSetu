import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import { getCoachApiContext, handleCoachApiError } from "@/lib/auth/coach-api-access";
import { listCoachSubmissions } from "@/lib/repositories/coach-media";

export const runtime = "nodejs";

loadEnv();

type RouteContext = {
  params: Promise<{ academyId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { academyId } = await context.params;
    const access = await getCoachApiContext(academyId);
    if (!access.ok) {
      return access.response;
    }

    const submissions = await listCoachSubmissions(academyId, access.context.coachId);
    return NextResponse.json({ submissions });
  } catch (error) {
    return handleCoachApiError(error);
  }
}
