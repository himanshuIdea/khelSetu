import { NextResponse } from "next/server";
import {
  getSessionCookieOptions,
  getSessionMaxAgeSeconds,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/cookies";
import { signSessionToken } from "@/lib/auth/jwt";
import { resolvePostAuthRedirect } from "@/lib/auth/redirect";
import type { AuthProfile } from "@/lib/auth/types";

export async function createAuthResponse(
  profile: AuthProfile,
  body: Record<string, unknown> = {}
) {
  const token = await signSessionToken({
    userId: profile.id,
    email: profile.email,
    phone: profile.phone,
    platformRole: profile.platformRole,
  });

  const response = NextResponse.json({
    user: {
      id: profile.id,
      email: profile.email,
      phone: profile.phone,
      fullName: profile.fullName,
      platformRole: profile.platformRole,
      phoneVerified: profile.phoneVerified,
    },
    academies: profile.academies,
    needsAcademyOnboarding: profile.needsAcademyOnboarding,
    redirectTo: resolvePostAuthRedirect(profile),
    ...body,
  });

  response.cookies.set(
    SESSION_COOKIE_NAME,
    token,
    getSessionCookieOptions(getSessionMaxAgeSeconds())
  );

  return response;
}

export function createLogoutResponse() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...getSessionCookieOptions(0),
    maxAge: 0,
  });
  return response;
}
