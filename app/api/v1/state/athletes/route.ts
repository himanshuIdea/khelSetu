import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import {
  assertStateAdminAccess,
  handleStateRouteError,
} from "@/app/api/v1/state/nurseries/_auth";
import {
  DEFAULT_ATHLETE_PAGE_SIZE,
  listStateAthletesPage,
} from "@/lib/repositories/state-athletes";
import type { StateAthleteFilters } from "@/lib/state-portal";

export const runtime = "nodejs";

loadEnv();

function parseFilters(searchParams: URLSearchParams): StateAthleteFilters {
  const sport = searchParams.get("sport") ?? undefined;
  const district = searchParams.get("district") ?? undefined;
  const minRatingRaw = searchParams.get("minRating");
  const search = searchParams.get("search") ?? undefined;

  const filters: StateAthleteFilters = {};
  if (sport) filters.sport = sport;
  if (district) filters.district = district;
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
      Math.max(1, Number(searchParams.get("limit") ?? DEFAULT_ATHLETE_PAGE_SIZE) || DEFAULT_ATHLETE_PAGE_SIZE)
    );

    const result = await listStateAthletesPage({
      filters: parseFilters(searchParams),
      offset,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleStateRouteError(error);
  }
}
