import { NextResponse } from "next/server";
import { AcademyAccessError, requireAcademyAccess } from "@/lib/auth/require-academy-access";
import { loadEnv } from "@/lib/load-env";
import { saveScheduleSettings } from "@/lib/repositories/timetable";
import { validateScheduleSettings, type ScheduleSettingsPayload } from "@/lib/timetable";

export const runtime = "nodejs";

loadEnv();

type RouteContext = {
  params: Promise<{ academyId: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { academyId } = await context.params;
    await requireAcademyAccess(academyId);

    const body = (await request.json()) as ScheduleSettingsPayload;
    const validationError = validateScheduleSettings(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const timetable = await saveScheduleSettings(academyId, body);
    return NextResponse.json(timetable);
  } catch (error) {
    if (error instanceof AcademyAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "Could not save timetable settings.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
