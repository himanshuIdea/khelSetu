import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/cookies";
import { verifySessionToken } from "@/lib/auth/jwt";
import {
  canAccessRoute,
  isStateAdmin,
  isStateRoute,
  PLATFORM_ROLES,
} from "@/lib/rbac";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isStateRoute(pathname) && !canAccessRoute(pathname, session.platformRole)) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  if (
    pathname.startsWith("/auth/onboarding") &&
    session.platformRole === PLATFORM_ROLES.STATE_ADMIN
  ) {
    return NextResponse.redirect(new URL("/state", request.url));
  }

  if (pathname.startsWith("/academy") && isStateAdmin(session.platformRole)) {
    return NextResponse.redirect(new URL("/state", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/state/:path*", "/academy/:path*", "/auth/onboarding"],
};
