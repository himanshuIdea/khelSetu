import { NextResponse } from "next/server";
import { AcademyAccessError, requireAcademyAccess } from "@/lib/auth/require-academy-access";
import { loadEnv } from "@/lib/load-env";
import { validateUpdateTeamMemberPayload, type UpdateTeamMemberPayload } from "@/lib/teams";
import {
  assertCoachCanManageTeam,
  getTeamAccessContext,
  handleTeamRouteError,
} from "@/app/api/v1/academies/[academyId]/teams/_auth";
import {
  removeTeamMember,
  updateTeamMemberRole,
  updateTeamMemberSelection,
} from "@/lib/repositories/teams";

export const runtime = "nodejs";

loadEnv();

type RouteContext = {
  params: Promise<{ academyId: string; teamId: string; playerId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { academyId, teamId, playerId } = await context.params;
    await requireAcademyAccess(academyId);

    const access = await getTeamAccessContext(academyId, { writable: true });
    if (!access.ok) {
      return access.response;
    }

    const manageError = await assertCoachCanManageTeam(academyId, teamId, access.context);
    if (manageError) {
      return manageError;
    }

    const body = (await request.json()) as UpdateTeamMemberPayload;
    const validationError = validateUpdateTeamMemberPayload(body);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const result: { selectionStatus?: string; role?: string } = {};

    if (body.selectionStatus !== undefined) {
      const selectionResult = await updateTeamMemberSelection(
        academyId,
        teamId,
        playerId,
        body.selectionStatus
      );
      result.selectionStatus = selectionResult.selectionStatus;
    }

    if (body.role !== undefined) {
      const roleResult = await updateTeamMemberRole(academyId, teamId, playerId, body.role);
      result.role = roleResult.role;
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AcademyAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "Could not update team member";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { academyId, teamId, playerId } = await context.params;
    await requireAcademyAccess(academyId);

    const access = await getTeamAccessContext(academyId, { writable: true });
    if (!access.ok) {
      return access.response;
    }

    const manageError = await assertCoachCanManageTeam(academyId, teamId, access.context);
    if (manageError) {
      return manageError;
    }

    await removeTeamMember(academyId, teamId, playerId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof AcademyAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "Could not remove team member";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
