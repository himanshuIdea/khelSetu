import { NextResponse } from "next/server";
import {
  getSessionCookieOptions,
  getSessionMaxAgeSeconds,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/cookies";
import { signSessionToken } from "@/lib/auth/jwt";
import type { PortalKind } from "@/lib/auth/portal-login";
import {
  resolvePostAuthRedirect,
  resolvePostAuthRedirectForPortal,
} from "@/lib/auth/redirect";
import type { AuthProfile } from "@/lib/auth/types";

export type AuthResponseOptions = {
  portal?: PortalKind;
  next?: string | null;
};

export async function createAuthResponse(
  profile: AuthProfile,
  options: AuthResponseOptions = {}
) {
  const redirectTo =
    options.portal != null
      ? await resolvePostAuthRedirectForPortal(profile, options.portal, options.next)
      : resolvePostAuthRedirect(profile);

  const token = await signSessionToken({
    userId: profile.id,
    email: profile.email,
    phone: profile.phone,
    platformRole: profile.platformRole,
    mustChangePassword: profile.mustChangePassword,
  });

  const response = NextResponse.json({
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
    redirectTo,
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
