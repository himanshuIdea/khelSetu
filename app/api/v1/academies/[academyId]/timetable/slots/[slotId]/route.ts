import { NextResponse } from "next/server";
import { AcademyAccessError, requireAcademyAccess } from "@/lib/auth/require-academy-access";
import { loadEnv } from "@/lib/load-env";
import { deleteSlot, updateSlot } from "@/lib/repositories/timetable";
import { validateSlotPayload, type SlotPayload } from "@/lib/timetable";

export const runtime = "nodejs";

loadEnv();

type RouteContext = {
  params: Promise<{ academyId: string; slotId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { academyId, slotId } = await context.params;
    await requireAcademyAccess(academyId);

    const body = (await request.json()) as SlotPayload;
    const validationError = validateSlotPayload(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const slot = await updateSlot(academyId, slotId, body);
    return NextResponse.json({ slot });
  } catch (error) {
    if (error instanceof AcademyAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "Could not update session.";
    const status =
      message.includes("not found") ? 404 : message.includes("already") || message.includes("within academy") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { academyId, slotId } = await context.params;
    await requireAcademyAccess(academyId);

    await deleteSlot(academyId, slotId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AcademyAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "Could not delete session.";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
