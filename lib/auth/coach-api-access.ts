import { NextResponse } from "next/server";
import { AuthRequiredError, requireSessionUserId } from "@/lib/auth/server";
import { MEMBERSHIP_ROLES } from "@/lib/rbac/membership-roles";
import { isStateAdmin } from "@/lib/rbac";
import { getAuthProfile } from "@/lib/repositories/auth";
import { resolveCoachForUser } from "@/lib/repositories/coaches";

export type CoachApiContext = {
  userId: string;
  coachId: string;
  isCoachRole: boolean;
};

export async function getCoachApiContext(academyId: string): Promise<
  | { ok: true; context: CoachApiContext }
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
          { error: "State administrators cannot use the coach portal." },
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
    if (!coach) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Coach profile not found." }, { status: 403 }),
      };
    }

    return {
      ok: true,
      context: {
        userId,
        coachId: coach.id,
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

    const message = error instanceof Error ? error.message : "Coach request failed.";
    return {
      ok: false,
      response: NextResponse.json({ error: message }, { status: 500 }),
    };
  }
}

export function handleCoachApiError(error: unknown) {
  if (error instanceof AuthRequiredError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  const message = error instanceof Error ? error.message : "Coach request failed.";
  const lower = message.toLowerCase();

  if (lower.includes("not assigned") || lower.includes("only manage")) {
    return NextResponse.json({ error: message }, { status: 403 });
  }

  if (
    lower.includes("unsupported video") ||
    lower.includes("50mb") ||
    lower.includes("video file is required") ||
    lower.includes("credentials are not configured")
  ) {
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ error: message }, { status: 500 });
}
