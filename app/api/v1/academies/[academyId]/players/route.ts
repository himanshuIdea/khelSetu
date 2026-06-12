import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import { AuthRequiredError, requireSessionUserId } from "@/lib/auth/server";
import { isStateAdmin } from "@/lib/rbac";
import {
  validateCreatePlayerPayload,
  type CreatePlayerPayload,
} from "@/lib/players";
import { getAuthProfile } from "@/lib/repositories/auth";
import { createPlayer } from "@/lib/repositories/players";

export const runtime = "nodejs";

loadEnv();

type RouteContext = {
  params: Promise<{ academyId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { academyId } = await context.params;
    const userId = await requireSessionUserId();
    const profile = await getAuthProfile(userId);

    if (!profile) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (isStateAdmin(profile.platformRole)) {
      return NextResponse.json(
        { error: "State administrators cannot manage academy players." },
        { status: 403 }
      );
    }

    const hasAccess = profile.academies.some((academy) => academy.id === academyId);
    if (!hasAccess) {
      return NextResponse.json({ error: "You do not have access to this academy." }, { status: 403 });
    }

    const body = (await request.json()) as CreatePlayerPayload;
    const validationError = validateCreatePlayerPayload(body);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const player = await createPlayer(academyId, body);
    return NextResponse.json(player, { status: 201 });
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    const message = error instanceof Error ? error.message : "Could not create player";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
