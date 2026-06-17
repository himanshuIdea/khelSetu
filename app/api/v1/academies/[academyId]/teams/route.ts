import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import { validateCreateTeamPayload, type CreateTeamPayload } from "@/lib/teams";
import {
  assertCoachCanCreateTeam,
  getTeamAccessContext,
  handleTeamRouteError,
  withCoachTeamPayload,
} from "@/app/api/v1/academies/[academyId]/teams/_auth";
import { createTeam } from "@/lib/repositories/teams";

export const runtime = "nodejs";

loadEnv();

type RouteContext = {
  params: Promise<{ academyId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { academyId } = await context.params;
    const access = await getTeamAccessContext(academyId);
    if (!access.ok) {
      return access.response;
    }

    const body = (await request.json()) as CreateTeamPayload;
    const validationError = validateCreateTeamPayload(body);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const coachError = await assertCoachCanCreateTeam(academyId, access.context, body);
    if (coachError) {
      return coachError;
    }

    const payload = withCoachTeamPayload(body, access.context);
    const team = await createTeam(academyId, payload);
    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    return handleTeamRouteError(error);
  }
}
