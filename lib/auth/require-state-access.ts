import { redirect } from "next/navigation";
import { getAuthProfile } from "@/lib/repositories/auth";
import { getSessionUserId } from "@/lib/auth/server";
import { canAccessStateRoutes } from "@/lib/rbac";

export async function requireStateAccess() {
  const userId = await getSessionUserId();
  if (!userId) {
    redirect("/auth/login");
  }

  const profile = await getAuthProfile(userId);
  if (!profile || !canAccessStateRoutes(profile.platformRole)) {
    redirect("/auth/login");
  }

  return profile;
}
