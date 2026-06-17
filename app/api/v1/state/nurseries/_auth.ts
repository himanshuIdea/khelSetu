import { NextResponse } from "next/server";
import { AuthRequiredError, requireSessionUserId } from "@/lib/auth/server";
import { isStateAdmin } from "@/lib/rbac";
import { getAuthProfile } from "@/lib/repositories/auth";

export async function assertStateAdminAccess() {
  const userId = await requireSessionUserId();
  const profile = await getAuthProfile(userId);

  if (!profile) {
    return { error: NextResponse.json({ error: "User not found." }, { status: 404 }) };
  }

  if (!isStateAdmin(profile.platformRole)) {
    return {
      error: NextResponse.json(
        { error: "Only state administrators can access this resource." },
        { status: 403 }
      ),
    };
  }

  return { userId, profile };
}

export function handleStateRouteError(error: unknown) {
  if (error instanceof AuthRequiredError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  const message = error instanceof Error ? error.message : "State request failed.";
  return NextResponse.json({ error: message }, { status: 500 });
}
