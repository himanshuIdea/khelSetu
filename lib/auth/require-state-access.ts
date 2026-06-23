import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { users } from "@/db/schema";
import type { StateAdminMeta } from "@/components/state/StateAdminMenu";
import { buildPortalLoginUrl } from "@/lib/auth/portal-login";
import { getSessionTokenPayload } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { canAccessStateRoutes, STATE_ROUTE_PREFIX } from "@/lib/rbac";

async function loadAdminDisplayName(userId: string): Promise<string> {
  const [row] = await db
    .select({ fullName: users.fullName })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row?.fullName ?? "Sports Dept.";
}

/** Fast state gate: JWT from middleware + one name lookup (no membership graph). */
export async function getStateAdminShellMeta(): Promise<StateAdminMeta> {
  const session = await getSessionTokenPayload();
  if (!session?.sub || !canAccessStateRoutes(session.platformRole)) {
    redirect(buildPortalLoginUrl("state", STATE_ROUTE_PREFIX));
  }

  const fullName = await loadAdminDisplayName(session.sub);
  return { fullName };
}
