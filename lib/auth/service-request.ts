import type { Context } from "hono";
import { SESSION_COOKIE_NAME } from "@/lib/auth/cookies";
import { verifySessionToken } from "@/lib/auth/jwt";
import {
  checkAcademyReadAccess,
  type AcademyAccessDenial,
} from "@/lib/auth/academy-access";

function parseSessionTokenFromCookie(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;

  for (const part of cookieHeader.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === SESSION_COOKIE_NAME) {
      const value = rest.join("=");
      return value ? decodeURIComponent(value) : null;
    }
  }

  return null;
}

/** Resolve authenticated user id from Cookie or Authorization header (gateway / microservices). */
export async function getUserIdFromRequest(c: Context): Promise<string | null> {
  const authHeader = c.req.header("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const payload = await verifySessionToken(authHeader.slice(7));
    return payload?.sub ?? null;
  }

  const token = parseSessionTokenFromCookie(c.req.header("cookie"));
  if (!token) return null;

  const payload = await verifySessionToken(token);
  return payload?.sub ?? null;
}

export type ServiceAccessDenial = AcademyAccessDenial;

/** Match Next.js academy read access — session required; state admins blocked. */
export async function assertAcademyReadAccess(
  userId: string,
  academyId: string
): Promise<ServiceAccessDenial | null> {
  return checkAcademyReadAccess(userId, academyId);
}
