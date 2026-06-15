import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import { validateSaveAttendancePayload, type SaveAttendancePayload } from "@/lib/attendance";
import { AuthRequiredError, requireSessionUserId } from "@/lib/auth/server";
import { isStateAdmin } from "@/lib/rbac";
import { getAuthProfile } from "@/lib/repositories/auth";
import {
  getAttendanceForBatchDate,
  saveAttendanceRecords,
} from "@/lib/repositories/attendance";

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
    const batchId = url.searchParams.get("batchId");
    const date = url.searchParams.get("date");

    if (!batchId || !date) {
      return NextResponse.json({ error: "batchId and date are required." }, { status: 400 });
    }

    const session = await getAttendanceForBatchDate(academyId, batchId, date);
    return NextResponse.json(session);
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    const message = error instanceof Error ? error.message : "Could not load attendance.";
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

    const body = (await request.json()) as SaveAttendancePayload;
    const validationError = validateSaveAttendancePayload(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const result = await saveAttendanceRecords(academyId, body);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    const message = error instanceof Error ? error.message : "Could not save attendance.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
