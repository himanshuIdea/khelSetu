import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import { getCoachApiContext, handleCoachApiError } from "@/lib/auth/coach-api-access";
import { setCoachPostPublished } from "@/lib/repositories/coach-media";

export const runtime = "nodejs";

loadEnv();

type RouteContext = {
  params: Promise<{ academyId: string; id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { academyId, id } = await context.params;
    const access = await getCoachApiContext(academyId, { writable: true });
    if (!access.ok) {
      return access.response;
    }

    const body = (await request.json()) as { published?: boolean };
    if (typeof body.published !== "boolean") {
      return NextResponse.json({ error: "published is required." }, { status: 400 });
    }

    await setCoachPostPublished(id, academyId, access.context.coachId, body.published);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleCoachApiError(error);
  }
}
