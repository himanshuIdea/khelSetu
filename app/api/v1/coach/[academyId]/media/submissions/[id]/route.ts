import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import { getCoachApiContext, handleCoachApiError } from "@/lib/auth/coach-api-access";
import { getCoachSubmissionDetail } from "@/lib/repositories/coach-media";

export const runtime = "nodejs";

loadEnv();

type RouteContext = {
  params: Promise<{ academyId: string; id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { academyId, id } = await context.params;
    const access = await getCoachApiContext(academyId);
    if (!access.ok) {
      return access.response;
    }

    const submission = await getCoachSubmissionDetail(id, access.context.coachId);
    if (!submission) {
      return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    }

    return NextResponse.json(submission);
  } catch (error) {
    return handleCoachApiError(error);
  }
}
