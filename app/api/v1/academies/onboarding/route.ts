import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import { validateOnboardingPayload, type OnboardingPayload } from "@/lib/onboarding";
import { createAcademyProfile } from "@/lib/repositories/onboarding";

export const runtime = "nodejs";

loadEnv();

export async function POST(request: Request) {
  const body = (await request.json()) as OnboardingPayload;
  const validationError = validateOnboardingPayload(body);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    const result = await createAcademyProfile(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create academy";
    const status = message.includes("already taken") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
