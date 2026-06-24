export const SESSION_COOKIE_NAME = "khelsetu_session";

function resolveCookieSecure(): boolean {
  const override = process.env.COOKIE_SECURE;
  if (override === "true") return true;
  if (override === "false") return false;

  // Vercel always serves over HTTPS — Secure cookies must be set in production.
  if (process.env.VERCEL) return true;

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

  if (appUrl) {
    try {
      return new URL(appUrl).protocol === "https:";
    } catch {
      // fall through to NODE_ENV fallback
    }
  }

  return process.env.NODE_ENV === "production";
}

export function getSessionCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: resolveCookieSecure(),
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export function getSessionMaxAgeSeconds(): number {
  const raw = process.env.JWT_EXPIRES_IN ?? "7d";
  const match = raw.match(/^(\d+)([dhms])$/);
  if (!match) return 7 * 24 * 60 * 60;

  const value = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 24 * 60 * 60,
  };
  return value * (multipliers[unit] ?? multipliers.d);
}
