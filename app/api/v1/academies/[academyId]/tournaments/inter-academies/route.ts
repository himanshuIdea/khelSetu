import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import {
  AcademyAdminAccessError,
  requireAcademyAdminAccess,
} from "@/lib/auth/require-academy-admin";
import { listInterAcademyOptions } from "@/lib/repositories/tournaments";

export const runtime = "nodejs";

loadEnv();

type RouteContext = {
  params: Promise<{ academyId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { academyId } = await context.params;
    await requireAcademyAdminAccess(academyId);

    const academies = await listInterAcademyOptions(academyId);
    return NextResponse.json({ academies });
  } catch (error) {
    if (error instanceof AcademyAdminAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Could not load academies.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
