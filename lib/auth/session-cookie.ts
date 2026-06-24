import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import {
  getSessionCookieOptions,
  getSessionMaxAgeSeconds,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/cookies";
import { signSessionToken } from "@/lib/auth/jwt";
import type { AuthProfile } from "@/lib/auth/types";

export async function createSessionTokenForProfile(profile: AuthProfile): Promise<string> {
  return signSessionToken({
    userId: profile.id,
    email: profile.email,
    phone: profile.phone,
    platformRole: profile.platformRole,
    mustChangePassword: profile.mustChangePassword,
  });
}

export function attachSessionCookie(
  response: NextResponse,
  token: string,
  requestUrl?: string | null
) {
  response.cookies.set(
    SESSION_COOKIE_NAME,
    token,
    getSessionCookieOptions(getSessionMaxAgeSeconds(), requestUrl)
  );
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(
    SESSION_COOKIE_NAME,
    token,
    getSessionCookieOptions(getSessionMaxAgeSeconds())
  );
}

export async function establishSessionForProfile(profile: AuthProfile): Promise<string> {
  const token = await createSessionTokenForProfile(profile);
  await setSessionCookie(token);
  return token;
}
