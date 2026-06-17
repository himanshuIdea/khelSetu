import { NextResponse } from "next/server";
import { MEMBERSHIP_ROLES } from "@/lib/rbac/membership-roles";
import { AuthRequiredError, requireSessionUserId } from "@/lib/auth/server";
import { isStateAdmin } from "@/lib/rbac";
import { getAuthProfile } from "@/lib/repositories/auth";
import { resolveCoachForUser } from "@/lib/repositories/coaches";
import { assertCoachOwnsTeam, assertCoachSportAssigned } from "@/lib/repositories/teams";
import type { CreateTeamPayload } from "@/lib/teams";

export type TeamAccessContext = {
  coachId: string | null;
  isCoachRole: boolean;
};

export async function getTeamAccessContext(academyId: string): Promise<
  | { ok: true; context: TeamAccessContext }
  | { ok: false; response: NextResponse }
> {
  try {
    const userId = await requireSessionUserId();
    const profile = await getAuthProfile(userId);

    if (!profile) {
      return {
        ok: false,
        response: NextResponse.json({ error: "User not found." }, { status: 404 }),
      };
    }

    if (isStateAdmin(profile.platformRole)) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "State administrators cannot manage academy teams." },
          { status: 403 }
        ),
      };
    }

    const membership = profile.academies.find((academy) => academy.id === academyId);
    if (!membership) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "You do not have access to this academy." },
          { status: 403 }
        ),
      };
    }

    const coach = await resolveCoachForUser(academyId, userId);

    return {
      ok: true,
      context: {
        coachId: coach?.id ?? null,
        isCoachRole: membership.role === MEMBERSHIP_ROLES.COACH,
      },
    };
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return {
        ok: false,
        response: NextResponse.json({ error: error.message }, { status: 401 }),
      };
    }

    const message = error instanceof Error ? error.message : "Team request failed.";
    return {
      ok: false,
      response: NextResponse.json({ error: message }, { status: 500 }),
    };
  }
}

export async function assertCoachCanCreateTeam(
  academyId: string,
  context: TeamAccessContext,
  payload: CreateTeamPayload
): Promise<NextResponse | null> {
  if (!context.isCoachRole || !context.coachId) {
    return null;
  }

  try {
    await assertCoachSportAssigned(academyId, context.coachId, payload.sportId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sport access denied.";
    return NextResponse.json({ error: message }, { status: 403 });
  }

  return null;
}

export function withCoachTeamPayload(
  payload: CreateTeamPayload,
  context: TeamAccessContext
): CreateTeamPayload {
  if (context.isCoachRole && context.coachId) {
    return { ...payload, coachId: context.coachId };
  }
  return payload;
}

export async function assertCoachCanManageTeam(
  academyId: string,
  teamId: string,
  context: TeamAccessContext
): Promise<NextResponse | null> {
  if (!context.isCoachRole || !context.coachId) {
    return null;
  }

  try {
    await assertCoachOwnsTeam(academyId, context.coachId, teamId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Team access denied.";
    return NextResponse.json({ error: message }, { status: 403 });
  }

  return null;
}

export function handleTeamRouteError(error: unknown) {
  if (error instanceof AuthRequiredError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  const message = error instanceof Error ? error.message : "Team request failed.";
  const status =
    message.includes("only manage") || message.includes("not assigned") ? 403 : 500;
  return NextResponse.json({ error: message }, { status });
}
