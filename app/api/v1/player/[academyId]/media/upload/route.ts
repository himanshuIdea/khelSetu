import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import { getPlayerApiContext, handlePlayerApiError } from "@/lib/auth/player-api-access";
import { removePlayerMediaUpload, savePlayerMediaUpload } from "@/lib/player-media-upload";
import { isPlayerSubmissionObjectKeyForAcademy } from "@/lib/storage/supabase-s3";

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

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Video file is required." }, { status: 400 });
    }

    const saved = await savePlayerMediaUpload(file, academyId);
    return NextResponse.json(saved);
  } catch (error) {
    return handlePlayerApiError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { academyId } = await context.params;
    const access = await getPlayerApiContext(academyId, { writable: true });
    if (!access.ok) {
      return access.response;
    }

    const objectKey = new URL(request.url).searchParams.get("objectKey")?.trim();
    if (!objectKey) {
      return NextResponse.json({ error: "objectKey is required." }, { status: 400 });
    }

    const isLocal = objectKey.startsWith("uploads/player-submissions/");
    const isRemote = isPlayerSubmissionObjectKeyForAcademy(objectKey, academyId);

    if (!isLocal && !isRemote) {
      return NextResponse.json({ error: "Invalid upload path." }, { status: 403 });
    }

    await removePlayerMediaUpload(objectKey, academyId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handlePlayerApiError(error);
  }
}
