import { NextResponse } from "next/server";
import { AcademyAccessError, requireAcademyAccess } from "@/lib/auth/require-academy-access";
import { loadEnv } from "@/lib/load-env";
import { createSlot } from "@/lib/repositories/timetable";
import { validateSlotPayload, type SlotPayload } from "@/lib/timetable";

export const runtime = "nodejs";

loadEnv();

type RouteContext = {
  params: Promise<{ academyId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { academyId } = await context.params;
    await requireAcademyAccess(academyId, { writable: true });

    const body = (await request.json()) as SlotPayload;
    const validationError = validateSlotPayload(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const slot = await createSlot(academyId, body);
    return NextResponse.json({ slot });
  } catch (error) {
    if (error instanceof AcademyAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "Could not create session.";
    const status = message.includes("already") || message.includes("within academy") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
