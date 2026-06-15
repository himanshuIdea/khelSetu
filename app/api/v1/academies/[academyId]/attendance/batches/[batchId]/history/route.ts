import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import { AuthRequiredError, requireSessionUserId } from "@/lib/auth/server";
import { isStateAdmin } from "@/lib/rbac";
import { getAuthProfile } from "@/lib/repositories/auth";
import { listBatchAttendanceHistory } from "@/lib/repositories/attendance";

export const runtime = "nodejs";

loadEnv();

type RouteContext = {
  params: Promise<{ academyId: string; batchId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { academyId, batchId } = await context.params;
    const userId = await requireSessionUserId();
    const profile = await getAuthProfile(userId);

    if (!profile) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (isStateAdmin(profile.platformRole)) {
      return NextResponse.json(
        { error: "State administrators cannot view academy attendance." },
        { status: 403 }
      );
    }

    const hasAccess = profile.academies.some((academy) => academy.id === academyId);
    if (!hasAccess) {
      return NextResponse.json({ error: "You do not have access to this academy." }, { status: 403 });
    }

    const history = await listBatchAttendanceHistory(academyId, batchId);
    return NextResponse.json(history);
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    const message = error instanceof Error ? error.message : "Could not load attendance history.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
