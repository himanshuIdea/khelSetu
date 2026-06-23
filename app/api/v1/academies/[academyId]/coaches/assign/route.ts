import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import { validateAssignCoachPayload, type AssignCoachPayload } from "@/lib/coaches";
import { AcademyAccessError, requireAcademyAccess } from "@/lib/auth/require-academy-access";
import { assignCoachToBatches } from "@/lib/repositories/coaches";

export const runtime = "nodejs";

loadEnv();

type RouteContext = {
  params: Promise<{ academyId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { academyId } = await context.params;
    await requireAcademyAccess(academyId, { writable: true });

    const body = (await request.json()) as AssignCoachPayload;
    const validationError = validateAssignCoachPayload(body);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const result = await assignCoachToBatches(academyId, body);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AcademyAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "Could not assign coach.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
