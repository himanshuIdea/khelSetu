import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import {
  validateSaveStaffAttendancePayload,
  type SaveStaffAttendancePayload,
} from "@/lib/staff-attendance";
import { AuthRequiredError, requireSessionUserId } from "@/lib/auth/server";
import { isStateAdmin } from "@/lib/rbac";
import { getAuthProfile } from "@/lib/repositories/auth";
import {
  getStaffRosterForDate,
  saveStaffAttendance,
} from "@/lib/repositories/staff-attendance";

export const runtime = "nodejs";

loadEnv();

type RouteContext = {
  params: Promise<{ academyId: string }>;
};

async function assertAcademyAccess(academyId: string) {
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

  const hasAccess = profile.academies.some((academy) => academy.id === academyId);
  if (!hasAccess) {
    return NextResponse.json({ error: "You do not have access to this academy." }, { status: 403 });
  }

  return null;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { academyId } = await context.params;
    const accessError = await assertAcademyAccess(academyId);
    if (accessError) {
      return accessError;
    }

    const url = new URL(request.url);
    const date = url.searchParams.get("date");

    if (!date) {
      return NextResponse.json({ error: "date is required." }, { status: 400 });
    }

    const session = await getStaffRosterForDate(academyId, date);
    return NextResponse.json(session);
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    const message = error instanceof Error ? error.message : "Could not load staff attendance.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { academyId } = await context.params;
    const accessError = await assertAcademyAccess(academyId);
    if (accessError) {
      return accessError;
    }

    const body = (await request.json()) as SaveStaffAttendancePayload;
    const validationError = validateSaveStaffAttendancePayload(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const result = await saveStaffAttendance(academyId, body);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    const message = error instanceof Error ? error.message : "Could not save staff attendance.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
