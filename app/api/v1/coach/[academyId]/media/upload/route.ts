import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import { getCoachApiContext, handleCoachApiError } from "@/lib/auth/coach-api-access";
import { saveCoachMediaUpload } from "@/lib/coach-media-upload";

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

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Video file is required." }, { status: 400 });
    }

    const saved = await saveCoachMediaUpload(file);
    return NextResponse.json(saved);
  } catch (error) {
    return handleCoachApiError(error);
  }
}
