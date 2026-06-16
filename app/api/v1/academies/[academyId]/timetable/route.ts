import { NextResponse } from "next/server";
import { AcademyAccessError, requireAcademyAccess } from "@/lib/auth/require-academy-access";
import { loadEnv } from "@/lib/load-env";
import { getTimetable } from "@/lib/repositories/timetable";

export const runtime = "nodejs";

loadEnv();

type RouteContext = {
  params: Promise<{ academyId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { academyId } = await context.params;
    await requireAcademyAccess(academyId);

    const timetable = await getTimetable(academyId);
    return NextResponse.json(timetable);
  } catch (error) {
    if (error instanceof AcademyAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "Could not load timetable.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
