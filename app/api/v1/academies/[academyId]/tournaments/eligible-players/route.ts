import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import {
  AcademyAdminAccessError,
  requireAcademyAdminAccess,
} from "@/lib/auth/require-academy-admin";
import { listEligiblePlayersForDivisionWithMeta } from "@/lib/repositories/tournaments";
import { AGE_DIVISIONS, type AgeDivision } from "@/lib/tournaments";

export const runtime = "nodejs";

loadEnv();

type RouteContext = {
  params: Promise<{ academyId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { academyId } = await context.params;
    await requireAcademyAdminAccess(academyId);

    const url = new URL(request.url);
    const sportId = url.searchParams.get("sportId");
    const ageDivision = url.searchParams.get("ageDivision") as AgeDivision | null;
    const weightClass = url.searchParams.get("weightClass");
    const scope = url.searchParams.get("scope");
    const academyIdsParam = url.searchParams.get("academyIds");

    if (!sportId) {
      return NextResponse.json({ error: "sportId is required." }, { status: 400 });
    }
    if (!ageDivision || !AGE_DIVISIONS.includes(ageDivision)) {
      return NextResponse.json({ error: "Valid ageDivision is required." }, { status: 400 });
    }

    const academyIds =
      scope === "inter_academy" && academyIdsParam
        ? academyIdsParam.split(",").filter(Boolean)
        : undefined;

    const { players, weightClasses } = await listEligiblePlayersForDivisionWithMeta({
      sportId,
      ageDivision,
      weightClass,
      academyId: scope === "inter_academy" ? undefined : academyId,
      academyIds: scope === "inter_academy" ? [academyId, ...(academyIds ?? [])] : undefined,
    });

    return NextResponse.json({ players, weightClasses });
  } catch (error) {
    if (error instanceof AcademyAdminAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Could not load eligible players.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
