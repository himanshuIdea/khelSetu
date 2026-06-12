import { NextResponse } from "next/server";
import { AcademyAccessError, requireAcademyAccess } from "@/lib/auth/require-academy-access";
import { loadEnv } from "@/lib/load-env";
import { validateUpdatePlayerPayload, type UpdatePlayerPayload } from "@/lib/players";
import {
  getPlayerDetail,
  getPlayerForEdit,
  removePlayer,
  updatePlayer,
} from "@/lib/repositories/players";

export const runtime = "nodejs";

loadEnv();

type RouteContext = {
  params: Promise<{ academyId: string; externalId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { academyId, externalId } = await context.params;
    await requireAcademyAccess(academyId);

    const forEdit = new URL(request.url).searchParams.get("for") === "edit";

    if (forEdit) {
      const player = await getPlayerForEdit(academyId, externalId);
      if (!player) {
        return NextResponse.json({ error: "Player not found." }, { status: 404 });
      }

      return NextResponse.json(player);
    }

    const player = await getPlayerDetail(academyId, externalId);
    if (!player) {
      return NextResponse.json({ error: "Player not found." }, { status: 404 });
    }

    return NextResponse.json(player);
  } catch (error) {
    if (error instanceof AcademyAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "Could not load player";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { academyId, externalId } = await context.params;
    await requireAcademyAccess(academyId);

    const body = (await request.json()) as UpdatePlayerPayload;
    const validationError = validateUpdatePlayerPayload(body);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const player = await updatePlayer(academyId, externalId, body);
    return NextResponse.json(player);
  } catch (error) {
    if (error instanceof AcademyAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "Could not update player";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { academyId, externalId } = await context.params;
    await requireAcademyAccess(academyId);

    await removePlayer(academyId, externalId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof AcademyAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "Could not remove player";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
