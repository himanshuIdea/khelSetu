import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import { validateSaveAttendancePayload, type SaveAttendancePayload } from "@/lib/attendance";
import {
  assertAcademyAttendanceAccess,
  handleAttendanceRouteError,
} from "@/app/api/v1/academies/[academyId]/attendance/_auth";
import {
  getAttendanceForBatchDate,
  saveAttendanceRecords,
} from "@/lib/repositories/attendance";

export const runtime = "nodejs";

loadEnv();

type RouteContext = {
  params: Promise<{ academyId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { academyId } = await context.params;
    const url = new URL(request.url);
    const batchId = url.searchParams.get("batchId");
    const date = url.searchParams.get("date");

    if (!batchId || !date) {
      return NextResponse.json({ error: "batchId and date are required." }, { status: 400 });
    }

    const accessError = await assertAcademyAttendanceAccess(academyId, batchId);
    if (accessError) {
      return accessError;
    }

    const session = await getAttendanceForBatchDate(academyId, batchId, date);
    return NextResponse.json(session);
  } catch (error) {
    return handleAttendanceRouteError(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { academyId } = await context.params;
    const body = (await request.json()) as SaveAttendancePayload;
    const validationError = validateSaveAttendancePayload(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const accessError = await assertAcademyAttendanceAccess(academyId, body.batchId, {
      writable: true,
    });
    if (accessError) {
      return accessError;
    }

    const result = await saveAttendanceRecords(academyId, body);
    return NextResponse.json(result);
  } catch (error) {
    return handleAttendanceRouteError(error);
  }
}
