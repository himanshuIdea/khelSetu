import { SignJWT, jwtVerify } from "jose";
import type { SessionTokenPayload } from "@/lib/auth/types";
import { PLATFORM_ROLES, type PlatformRole } from "@/lib/rbac";

const DEFAULT_EXPIRES_IN = "7d";

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured.");
  }
  return new TextEncoder().encode(secret);
}

function getExpiresInSeconds(): number {
  const raw = process.env.JWT_EXPIRES_IN ?? DEFAULT_EXPIRES_IN;
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

export async function signSessionToken(input: {
  userId: string;
  email?: string | null;
  phone?: string | null;
  platformRole?: PlatformRole | null;
  mustChangePassword?: boolean;
}): Promise<string> {
  const payload: SessionTokenPayload = {
    sub: input.userId,
    ...(input.email ? { email: input.email } : {}),
    ...(input.phone ? { phone: input.phone } : {}),
    ...(input.platformRole ? { platformRole: input.platformRole } : {}),
    ...(input.mustChangePassword ? { mustChangePassword: true } : {}),
  };

  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${getExpiresInSeconds()}s`)
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string
): Promise<SessionTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.sub !== "string") return null;

    return {
      sub: payload.sub,
      email: typeof payload.email === "string" ? payload.email : undefined,
      phone: typeof payload.phone === "string" ? payload.phone : undefined,
      platformRole:
        payload.platformRole === PLATFORM_ROLES.STATE_ADMIN
          ? PLATFORM_ROLES.STATE_ADMIN
          : undefined,
      mustChangePassword: payload.mustChangePassword === true,
    };
  } catch {
    return null;
  }
}
