import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import { AuthRequiredError, requireSessionUserId } from "@/lib/auth/server";
import { isStateAdmin } from "@/lib/rbac";
import { validateCreateCoachPayload, type CreateCoachPayload } from "@/lib/coaches";
import { getAuthProfile } from "@/lib/repositories/auth";
import { createCoach } from "@/lib/repositories/coaches";

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
        { error: "State administrators cannot manage academy coaches." },
        { status: 403 }
      );
    }

    const hasAccess = profile.academies.some((academy) => academy.id === academyId);
    if (!hasAccess) {
      return NextResponse.json({ error: "You do not have access to this academy." }, { status: 403 });
    }

    const body = (await request.json()) as CreateCoachPayload;
    const validationError = validateCreateCoachPayload(body);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const coach = await createCoach(academyId, body);
    return NextResponse.json(coach, { status: 201 });
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    const message = error instanceof Error ? error.message : "Could not create coach";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
