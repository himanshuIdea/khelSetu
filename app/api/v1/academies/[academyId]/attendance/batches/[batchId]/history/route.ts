import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import {
  assertAcademyAttendanceAccess,
  handleAttendanceRouteError,
} from "@/app/api/v1/academies/[academyId]/attendance/_auth";
import { listBatchAttendanceHistory } from "@/lib/repositories/attendance";

export const runtime = "nodejs";

loadEnv();

type RouteContext = {
  params: Promise<{ academyId: string; batchId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { academyId, batchId } = await context.params;
    const accessError = await assertAcademyAttendanceAccess(academyId, batchId);
    if (accessError) {
      return accessError;
    }

    const history = await listBatchAttendanceHistory(academyId, batchId);
    return NextResponse.json(history);
  } catch (error) {
    return handleAttendanceRouteError(error);
  }
}
