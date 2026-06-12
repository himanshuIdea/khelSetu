import { NextResponse } from "next/server";
import { SlugTakenError } from "@/lib/db";
import { loadEnv } from "@/lib/load-env";
import { AuthRequiredError, requireSessionUserId } from "@/lib/auth/server";
import { validateOnboardingPayload, type OnboardingPayload } from "@/lib/onboarding";
import { isStateAdmin } from "@/lib/rbac";
import { getAuthProfile, userHasAcademyMembership } from "@/lib/repositories/auth";
import { createAcademyProfile } from "@/lib/repositories/onboarding";

export const runtime = "nodejs";

loadEnv();

export async function POST(request: Request) {
  try {
    const userId = await requireSessionUserId();
    const profile = await getAuthProfile(userId);

    if (!profile) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (isStateAdmin(profile.platformRole)) {
      return NextResponse.json(
        { error: "State administrators cannot create academies." },
        { status: 403 }
      );
    }

    if (await userHasAcademyMembership(userId)) {
      return NextResponse.json(
        { error: "You already have an academy linked to your account." },
        { status: 409 }
      );
    }

    const body = (await request.json()) as OnboardingPayload;
    const validationError = validateOnboardingPayload(body);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const result = await createAcademyProfile(userId, body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof SlugTakenError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    const message = error instanceof Error ? error.message : "Could not create academy";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
