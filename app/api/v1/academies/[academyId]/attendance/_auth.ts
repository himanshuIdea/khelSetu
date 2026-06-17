import { NextResponse } from "next/server";
import { MEMBERSHIP_ROLES } from "@/lib/rbac/membership-roles";
import { AuthRequiredError, requireSessionUserId } from "@/lib/auth/server";
import { isStateAdmin } from "@/lib/rbac";
import { getAuthProfile } from "@/lib/repositories/auth";
import {
  assertCoachAssignedToBatch,
  resolveCoachForUser,
} from "@/lib/repositories/coaches";

export async function assertAcademyAttendanceAccess(academyId: string, batchId?: string) {
  const userId = await requireSessionUserId();
  const profile = await getAuthProfile(userId);

  if (!profile) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (isStateAdmin(profile.platformRole)) {
    return NextResponse.json(
      { error: "State administrators cannot manage academy attendance." },
      { status: 403 }
    );
  }

  const membership = profile.academies.find((academy) => academy.id === academyId);
  if (!membership) {
    return NextResponse.json({ error: "You do not have access to this academy." }, { status: 403 });
  }

  if (membership.role === MEMBERSHIP_ROLES.COACH) {
    const coach = await resolveCoachForUser(academyId, userId);
    if (!coach) {
      return NextResponse.json({ error: "Coach profile not found." }, { status: 403 });
    }

    if (batchId) {
      try {
        await assertCoachAssignedToBatch(academyId, coach.id, batchId);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Batch access denied.";
        return NextResponse.json({ error: message }, { status: 403 });
      }
    }
  }

  return null;
}

export function handleAttendanceRouteError(error: unknown) {
  if (error instanceof AuthRequiredError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  const message = error instanceof Error ? error.message : "Attendance request failed.";
  return NextResponse.json({ error: message }, { status: 500 });
}
