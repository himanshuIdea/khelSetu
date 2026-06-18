import { createMiddleware } from "hono/factory";
import {
  assertAcademyReadAccess,
  getUserIdFromRequest,
} from "@/lib/auth/service-request";

/** Paths that do not require a session (slug availability check). */
const PUBLIC_PATH_PATTERNS = [
  /^\/api\/v1\/academies\/slug\/[^/]+\/available$/,
  /^\/academies\/slug\/[^/]+\/available$/,
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATH_PATTERNS.some((pattern) => pattern.test(pathname));
}

function extractAcademyId(pathname: string): string | null {
  const match = pathname.match(
    /\/academies\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i
  );
  return match?.[1] ?? null;
}

export const gatewayAuthMiddleware = createMiddleware(async (c, next) => {
  const pathname = new URL(c.req.url).pathname;
  if (isPublicPath(pathname)) {
    return next();
  }

  const userId = await getUserIdFromRequest(c);
  if (!userId) {
    return c.json({ error: "Authentication required." }, 401);
  }

  const academyId = extractAcademyId(pathname);
  if (academyId) {
    const denial = await assertAcademyReadAccess(userId, academyId);
    if (denial) {
      return c.json({ error: denial.error }, denial.status);
    }
  }

  return next();
});

/** Auth for standalone microservices (paths omit `/api/v1` prefix). */
export function createServiceAuthMiddleware(publicPathPatterns: RegExp[] = []) {
  return createMiddleware(async (c, next) => {
    const pathname = c.req.path;
    if (isPublicPath(pathname) || publicPathPatterns.some((pattern) => pattern.test(pathname))) {
      return next();
    }

    const userId = await getUserIdFromRequest(c);
    if (!userId) {
      return c.json({ error: "Authentication required." }, 401);
    }

    const academyId = c.req.param("academyId") ?? extractAcademyId(pathname);
    if (academyId) {
      const denial = await assertAcademyReadAccess(userId, academyId);
      if (denial) {
        return c.json({ error: denial.error }, denial.status);
      }
    }

    return next();
  });
}
