import { redirect } from "next/navigation";
import { buildPortalLoginUrl } from "@/lib/auth/portal-login";
import { getAuthProfile } from "@/lib/repositories/auth";
import { getSessionUserId } from "@/lib/auth/server";
import { canAccessStateRoutes, STATE_ROUTE_PREFIX } from "@/lib/rbac";

export async function requireStateAccess() {
  const userId = await getSessionUserId();
  if (!userId) {
    redirect(buildPortalLoginUrl("state", STATE_ROUTE_PREFIX));
  }

  const profile = await getAuthProfile(userId);
  if (!profile || !canAccessStateRoutes(profile.platformRole)) {
    redirect(buildPortalLoginUrl("state", STATE_ROUTE_PREFIX));
  }

  return profile;
}
