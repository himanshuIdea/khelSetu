import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import { AuthRequiredError, requireSessionUserId } from "@/lib/auth/server";
import { isStateAdmin } from "@/lib/rbac";
import { getAuthProfile } from "@/lib/repositories/auth";

export const runtime = "nodejs";

loadEnv();

export async function assertAcademyFeesAccess(academyId: string) {
  const userId = await requireSessionUserId();
  const profile = await getAuthProfile(userId);

  if (!profile) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (isStateAdmin(profile.platformRole)) {
    return NextResponse.json(
      { error: "State administrators cannot manage academy fees." },
      { status: 403 }
    );
  }

  const hasAccess = profile.academies.some((academy) => academy.id === academyId);
  if (!hasAccess) {
    return NextResponse.json({ error: "You do not have access to this academy." }, { status: 403 });
  }

  return null;
}

export function handleFeesRouteError(error: unknown) {
  if (error instanceof AuthRequiredError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  const message = error instanceof Error ? error.message : "Fees request failed.";
  return NextResponse.json({ error: message }, { status: 500 });
}
