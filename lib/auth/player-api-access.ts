import { NextResponse } from "next/server";
import { AuthRequiredError, requireSessionUserId } from "@/lib/auth/server";
import { canAccessPlayerPortal } from "@/lib/auth/membership-access";
import { isStateAdmin } from "@/lib/rbac";
import { getAuthProfile } from "@/lib/repositories/auth";
import { resolvePlayerForUser } from "@/lib/repositories/players";
import {
  ACADEMY_READONLY_MESSAGE,
  isAcademyNurseryDeregistered,
} from "@/lib/repositories/state-nurseries";

export type PlayerApiContext = {
  userId: string;
  playerId: string;
  academyId: string;
};

type PlayerApiAccessOptions = {
  writable?: boolean;
};

export async function getPlayerApiContext(
  academyId: string,
  options?: PlayerApiAccessOptions
): Promise<
  | { ok: true; context: PlayerApiContext }
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
          { error: "State administrators cannot use the player portal." },
          { status: 403 }
        ),
      };
    }

    if (!canAccessPlayerPortal(profile)) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Player portal access denied." }, { status: 403 }),
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

    const player = await resolvePlayerForUser(academyId, userId);
    if (!player) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Player profile not found." }, { status: 403 }),
      };
    }

    if (options?.writable && (await isAcademyNurseryDeregistered(academyId))) {
      return {
        ok: false,
        response: NextResponse.json({ error: ACADEMY_READONLY_MESSAGE }, { status: 403 }),
      };
    }

    return {
      ok: true,
      context: {
        userId,
        playerId: player.id,
        academyId,
      },
    };
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return {
        ok: false,
        response: NextResponse.json({ error: error.message }, { status: 401 }),
      };
    }

    const message = error instanceof Error ? error.message : "Player request failed.";
    return {
      ok: false,
      response: NextResponse.json({ error: message }, { status: 500 }),
    };
  }
}

export function handlePlayerApiError(error: unknown) {
  if (error instanceof AuthRequiredError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  const message = error instanceof Error ? error.message : "Player request failed.";
  const lower = message.toLowerCase();

  if (
    lower.includes("unsupported video") ||
    lower.includes("50mb") ||
    lower.includes("video file is required") ||
    lower.includes("credentials are not configured")
  ) {
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (lower.includes("not found") || lower.includes("invalid")) {
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ error: message }, { status: 500 });
}
