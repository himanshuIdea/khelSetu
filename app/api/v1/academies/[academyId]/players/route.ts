import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import { AcademyAccessError, requireAcademyAccess } from "@/lib/auth/require-academy-access";
import {
  validateCreatePlayerPayload,
  type CreatePlayerPayload,
} from "@/lib/players";
import { createPlayer } from "@/lib/repositories/players";

export const runtime = "nodejs";

loadEnv();

type RouteContext = {
  params: Promise<{ academyId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { academyId } = await context.params;
    await requireAcademyAccess(academyId, { writable: true });

    const body = (await request.json()) as CreatePlayerPayload;
    const validationError = validateCreatePlayerPayload(body);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const player = await createPlayer(academyId, body);
    return NextResponse.json(player, { status: 201 });
  } catch (error) {
    if (error instanceof AcademyAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "Could not create player";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
