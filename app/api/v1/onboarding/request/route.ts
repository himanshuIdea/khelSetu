import { NextResponse } from "next/server";
import type { AcademyOnboardingDraftPayload } from "@/lib/academy-onboarding";
import { loadEnv } from "@/lib/load-env";
import { AuthRequiredError, requireSessionUserId } from "@/lib/auth/server";
import { isStateAdmin } from "@/lib/rbac";
import { getAuthProfile, userHasAcademyMembership } from "@/lib/repositories/auth";
import {
  getOnboardingRequestByUserId,
  OnboardingRequestError,
  upsertOnboardingDraft,
} from "@/lib/repositories/academy-onboarding";

export const runtime = "nodejs";

loadEnv();

export async function GET() {
  try {
    const userId = await requireSessionUserId();
    const profile = await getAuthProfile(userId);

    if (!profile) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (isStateAdmin(profile.platformRole)) {
      return NextResponse.json(
        { error: "State administrators cannot access academy onboarding." },
        { status: 403 }
      );
    }

    const request = await getOnboardingRequestByUserId(userId);
    return NextResponse.json({ request });
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Could not load onboarding request.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
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
        { error: "You already have a verified academy." },
        { status: 409 }
      );
    }

    const body = (await request.json()) as AcademyOnboardingDraftPayload;
    const saved = await upsertOnboardingDraft(userId, body);
    return NextResponse.json({ request: saved });
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof OnboardingRequestError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Could not save onboarding draft.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
