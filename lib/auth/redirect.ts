import type { AuthProfile } from "@/lib/auth/types";
import { isStateAdmin, STATE_ROUTE_PREFIX } from "@/lib/rbac";

export function resolvePostAuthRedirect(profile: AuthProfile): string {
  if (isStateAdmin(profile.platformRole)) {
    return STATE_ROUTE_PREFIX;
  }

  if (profile.academies.length > 0) {
    return `/academy/${profile.academies[0].id}/dashboard`;
  }

  return "/auth/onboarding";
}
