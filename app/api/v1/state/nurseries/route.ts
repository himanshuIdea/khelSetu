import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import type { NurseryVerificationStatus } from "@/lib/state-nurseries";
import {
  assertStateAdminAccess,
  handleStateRouteError,
} from "@/app/api/v1/state/nurseries/_auth";
import {
  listStateNurseries,
  registerStateNursery,
} from "@/lib/repositories/state-nurseries";

export const runtime = "nodejs";

loadEnv();

function parseFilters(searchParams: URLSearchParams) {
  const district = searchParams.get("district") ?? undefined;
  const sport = searchParams.get("sport") ?? undefined;
  const statusParam = searchParams.get("status");
  const status =
    statusParam && statusParam !== "all"
      ? (statusParam as NurseryVerificationStatus)
      : undefined;

  return {
    district: district && district !== "all" ? district : undefined,
    sport: sport && sport !== "all" ? sport : undefined,
    status: status ?? (statusParam === "all" ? ("all" as const) : undefined),
  };
}

export async function GET(request: Request) {
  try {
    const auth = await assertStateAdminAccess();
    if ("error" in auth) return auth.error;

    const { searchParams } = new URL(request.url);
    const nurseries = await listStateNurseries(parseFilters(searchParams));

    return NextResponse.json({ nurseries });
  } catch (error) {
    return handleStateRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await assertStateAdminAccess();
    if ("error" in auth) return auth.error;

    const body = (await request.json()) as { academyId?: string };
    if (!body.academyId?.trim()) {
      return NextResponse.json({ error: "Academy is required." }, { status: 400 });
    }

    await registerStateNursery(body.academyId.trim(), auth.userId);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return handleStateRouteError(error);
  }
}
