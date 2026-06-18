import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import { getCoachApiContext, handleCoachApiError } from "@/lib/auth/coach-api-access";
import { removeCoachMediaUpload, saveCoachMediaUpload } from "@/lib/coach-media-upload";
import { isCoachDrillObjectKeyForAcademy } from "@/lib/storage/supabase-s3";

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

    const saved = await saveCoachMediaUpload(file, academyId);
    return NextResponse.json(saved);
  } catch (error) {
    return handleCoachApiError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { academyId } = await context.params;
    const access = await getCoachApiContext(academyId);
    if (!access.ok) {
      return access.response;
    }

    const objectKey = new URL(request.url).searchParams.get("objectKey")?.trim();
    if (!objectKey) {
      return NextResponse.json({ error: "objectKey is required." }, { status: 400 });
    }

    const isLocal = objectKey.startsWith("uploads/coach-media/");
    const isRemote = isCoachDrillObjectKeyForAcademy(objectKey, academyId);

    if (!isLocal && !isRemote) {
      return NextResponse.json({ error: "Invalid upload path." }, { status: 403 });
    }

    await removeCoachMediaUpload(objectKey, academyId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleCoachApiError(error);
  }
}
