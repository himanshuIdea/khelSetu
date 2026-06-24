export const SESSION_COOKIE_NAME = "khelsetu_session";

function isLocalHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host === "::1";
}

/** Secure only when the app is served over HTTPS (Vercel or explicit https APP_URL). */
export function resolveCookieSecure(requestUrl?: string | null): boolean {
  const override = process.env.COOKIE_SECURE;
  if (override === "true") return true;
  if (override === "false") return false;

  // Vercel always serves over HTTPS — Secure cookies must be set in production.
  if (process.env.VERCEL) return true;

  if (requestUrl) {
    try {
      const { protocol, hostname } = new URL(requestUrl);
      if (isLocalHost(hostname)) return false;
      return protocol === "https:";
    } catch {
      // fall through
    }
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

  if (appUrl) {
    try {
      const { protocol, hostname } = new URL(appUrl);
      if (isLocalHost(hostname)) return false;
      return protocol === "https:";
    } catch {
      // fall through
    }
  }

  // Local `next start` on HTTP — never force Secure (browser would drop the cookie).
  return false;
}

export function getSessionCookieOptions(maxAgeSeconds: number, requestUrl?: string | null) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: resolveCookieSecure(requestUrl),
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
