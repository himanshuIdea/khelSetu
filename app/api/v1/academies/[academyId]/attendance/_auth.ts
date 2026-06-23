import { NextResponse } from "next/server";
import { MEMBERSHIP_ROLES } from "@/lib/rbac/membership-roles";
import { AuthRequiredError, requireSessionUserId } from "@/lib/auth/server";
import {
  checkAcademyReadAccess,
  getAcademyMembershipRole,
} from "@/lib/auth/academy-access";
import {
  assertCoachAssignedToBatch,
  resolveCoachForUser,
} from "@/lib/repositories/coaches";
import {
  ACADEMY_READONLY_MESSAGE,
  isAcademyNurseryDeregistered,
} from "@/lib/repositories/state-nurseries";

export async function assertAcademyAttendanceAccess(
  academyId: string,
  batchId?: string,
  options?: { writable?: boolean }
) {
  const userId = await requireSessionUserId();
  const denial = await checkAcademyReadAccess(userId, academyId, {
    stateAdminMessage: "State administrators cannot manage academy attendance.",
  });

  if (denial) {
    return NextResponse.json({ error: denial.error }, { status: denial.status });
  }

  const role = await getAcademyMembershipRole(userId, academyId);
  if (!role) {
    return NextResponse.json({ error: "You do not have access to this academy." }, { status: 403 });
  }

  if (role === MEMBERSHIP_ROLES.COACH) {
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

  if (options?.writable && (await isAcademyNurseryDeregistered(academyId))) {
    return NextResponse.json({ error: ACADEMY_READONLY_MESSAGE }, { status: 403 });
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
