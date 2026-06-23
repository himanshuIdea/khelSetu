import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import { resolvePostAuthRedirect } from "@/lib/auth/redirect";
import { AuthRequiredError, requireSessionUserId } from "@/lib/auth/server";
import { getAuthProfile } from "@/lib/repositories/auth";

export const runtime = "nodejs";

loadEnv();

export async function GET() {
  try {
    const userId = await requireSessionUserId();
    const profile = await getAuthProfile(userId);

    if (!profile) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: profile.id,
        username: profile.username,
        email: profile.email,
        phone: profile.phone,
        fullName: profile.fullName,
        platformRole: profile.platformRole,
        phoneVerified: profile.phoneVerified,
        mustChangePassword: profile.mustChangePassword,
      },
      academies: profile.academies,
      needsAcademyOnboarding: profile.needsAcademyOnboarding,
      requiresNurseryReregistration: profile.requiresNurseryReregistration,
      onboardingRequest: profile.onboardingRequest,
      redirectTo: resolvePostAuthRedirect(profile),
    });
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    const message = error instanceof Error ? error.message : "Could not load session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
