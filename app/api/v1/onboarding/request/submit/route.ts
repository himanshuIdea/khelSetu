import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import { AuthRequiredError, requireSessionUserId } from "@/lib/auth/server";
import { isStateAdmin } from "@/lib/rbac";
import { getAuthProfile, userHasAcademyMembership } from "@/lib/repositories/auth";
import {
  OnboardingRequestError,
  submitOnboardingRequest,
} from "@/lib/repositories/academy-onboarding";

export const runtime = "nodejs";

loadEnv();

export async function POST() {
  try {
    const userId = await requireSessionUserId();
    const profile = await getAuthProfile(userId);

    if (!profile) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (isStateAdmin(profile.platformRole)) {
      return NextResponse.json(
        { error: "State administrators cannot submit academy onboarding." },
        { status: 403 }
      );
    }

    if (await userHasAcademyMembership(userId)) {
      return NextResponse.json(
        { error: "You already have a verified academy." },
        { status: 409 }
      );
    }

    const request = await submitOnboardingRequest(userId);
    return NextResponse.json({ request });
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof OnboardingRequestError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Could not submit onboarding request.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
