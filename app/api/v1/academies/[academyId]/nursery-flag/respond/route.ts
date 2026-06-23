import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import {
  AcademyAdminAccessError,
  requireAcademyAdminAccess,
} from "@/lib/auth/require-academy-admin";
import { respondToNurseryFlag } from "@/lib/repositories/state-nurseries";

export const runtime = "nodejs";

loadEnv();

type RouteContext = {
  params: Promise<{ academyId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { academyId } = await context.params;
    await requireAcademyAdminAccess(academyId, { writable: true });

    const body = (await request.json()) as {
      action: "addressed" | "request_review";
      note?: string;
    };

    if (body.action !== "addressed" && body.action !== "request_review") {
      return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }

    const flag = await respondToNurseryFlag(academyId, {
      action: body.action,
      note: body.note,
    });

    return NextResponse.json({ flag });
  } catch (error) {
    if (error instanceof AcademyAdminAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Could not submit flag response.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
