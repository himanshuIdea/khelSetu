import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import {
  assertStateAdminAccess,
  handleStateRouteError,
} from "@/app/api/v1/state/nurseries/_auth";
import {
  DEFAULT_SCOUTING_PAGE_SIZE,
  listStateScoutingProspectsPage,
} from "@/lib/repositories/state-scouting";
import type { StateScoutingFilters } from "@/lib/state-portal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

loadEnv();

function parseFilters(searchParams: URLSearchParams): StateScoutingFilters {
  const sport = searchParams.get("sport") ?? undefined;
  const district = searchParams.get("district") ?? undefined;
  const ageGroup = searchParams.get("ageGroup") ?? undefined;
  const minRatingRaw = searchParams.get("minRating");
  const search = searchParams.get("search") ?? undefined;
  const status = searchParams.get("status") ?? undefined;

  const filters: StateScoutingFilters = {};
  if (sport) filters.sport = sport;
  if (district) filters.district = district;
  if (ageGroup) filters.ageGroup = ageGroup;
  if (status) filters.status = status;
  if (search?.trim()) filters.search = search.trim();
  if (minRatingRaw != null && minRatingRaw !== "") {
    const parsed = Number(minRatingRaw);
    if (!Number.isNaN(parsed)) filters.minRating = parsed;
  }

  return filters;
}

export async function GET(request: Request) {
  try {
    const auth = await assertStateAdminAccess();
    if ("error" in auth) return auth.error;

    const { searchParams } = new URL(request.url);
    const offset = Math.max(0, Number(searchParams.get("offset") ?? 0) || 0);
    const limit = Math.min(
      100,
      Math.max(
        1,
        Number(searchParams.get("limit") ?? DEFAULT_SCOUTING_PAGE_SIZE) ||
          DEFAULT_SCOUTING_PAGE_SIZE
      )
    );

    const result = await listStateScoutingProspectsPage({
      filters: parseFilters(searchParams),
      offset,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleStateRouteError(error);
  }
}
