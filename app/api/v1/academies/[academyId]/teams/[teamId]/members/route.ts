import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import { validateAddTeamMembersPayload, type AddTeamMembersPayload } from "@/lib/teams";
import {
  assertCoachCanManageTeam,
  getTeamAccessContext,
  handleTeamRouteError,
} from "@/app/api/v1/academies/[academyId]/teams/_auth";
import { addTeamMembers } from "@/lib/repositories/teams";

export const runtime = "nodejs";

loadEnv();

type RouteContext = {
  params: Promise<{ academyId: string; teamId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { academyId, teamId } = await context.params;
    const access = await getTeamAccessContext(academyId);
    if (!access.ok) {
      return access.response;
    }

    const manageError = await assertCoachCanManageTeam(academyId, teamId, access.context);
    if (manageError) {
      return manageError;
    }

    const body = (await request.json()) as AddTeamMembersPayload;
    const validationError = validateAddTeamMembersPayload(body);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const result = await addTeamMembers(academyId, teamId, body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleTeamRouteError(error);
  }
}
