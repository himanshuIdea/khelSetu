import { and, eq } from "drizzle-orm";
import { academyMemberships, users } from "@/db/schema";
import { isStateAdmin } from "@/lib/rbac";
import { db } from "@/lib/db";

export type AcademyAccessDenial = { status: 401 | 403 | 404; error: string };

const ACCESS_CACHE_TTL_MS = 30_000;
const accessCache = new Map<string, { denial: AcademyAccessDenial | null; expires: number }>();

function accessCacheKey(userId: string, academyId: string) {
  return `${userId}:${academyId}`;
}

function readCachedAccess(userId: string, academyId: string): AcademyAccessDenial | null | undefined {
  const entry = accessCache.get(accessCacheKey(userId, academyId));
  if (!entry) return undefined;
  if (entry.expires <= Date.now()) {
    accessCache.delete(accessCacheKey(userId, academyId));
    return undefined;
  }
  return entry.denial;
}

function writeCachedAccess(
  userId: string,
  academyId: string,
  denial: AcademyAccessDenial | null
) {
  accessCache.set(accessCacheKey(userId, academyId), {
    denial,
    expires: Date.now() + ACCESS_CACHE_TTL_MS,
  });
}

/**
 * Fast academy read guard — one DB round-trip, cached 30s per user+academy.
 * Used by gateway auth and API route access checks (not full profile loads).
 */
export async function checkAcademyReadAccess(
  userId: string,
  academyId: string,
  options?: { stateAdminMessage?: string }
): Promise<AcademyAccessDenial | null> {
  const cached = readCachedAccess(userId, academyId);
  if (cached !== undefined) return cached;

  const [row] = await db
    .select({
      platformRole: users.platformRole,
      membershipId: academyMemberships.academyId,
    })
    .from(users)
    .leftJoin(
      academyMemberships,
      and(
        eq(academyMemberships.userId, users.id),
        eq(academyMemberships.academyId, academyId)
      )
    )
    .where(eq(users.id, userId))
    .limit(1);

  if (!row) {
    const denial: AcademyAccessDenial = { status: 404, error: "User not found." };
    writeCachedAccess(userId, academyId, denial);
    return denial;
  }

  if (isStateAdmin(row.platformRole)) {
    const denial: AcademyAccessDenial = {
      status: 403,
      error:
        options?.stateAdminMessage ??
        "State administrators cannot access academy data via this API.",
    };
    writeCachedAccess(userId, academyId, denial);
    return denial;
  }

  if (!row.membershipId) {
    const denial: AcademyAccessDenial = {
      status: 403,
      error: "You do not have access to this academy.",
    };
    writeCachedAccess(userId, academyId, denial);
    return denial;
  }

  writeCachedAccess(userId, academyId, null);
  return null;
}

/** Membership role for one academy — used when route logic depends on admin vs coach. */
export async function getAcademyMembershipRole(
  userId: string,
  academyId: string
): Promise<string | null> {
  const [row] = await db
    .select({ role: academyMemberships.role })
    .from(academyMemberships)
    .where(
      and(eq(academyMemberships.userId, userId), eq(academyMemberships.academyId, academyId))
    )
    .limit(1);

  return row?.role ?? null;
}
