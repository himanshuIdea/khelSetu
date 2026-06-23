import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import {
  assertStateAdminAccess,
  handleStateRouteError,
} from "@/app/api/v1/state/nurseries/_auth";
import {
  DEFAULT_SCHEME_BENEFICIARY_PAGE_SIZE,
  listSchemeBeneficiariesPage,
} from "@/lib/repositories/state-funds";
import type { StateFundBeneficiaryFilters } from "@/lib/state-portal";
import type { GrantStatusFilter } from "@/lib/state-fund-filters";

export const runtime = "nodejs";

loadEnv();

type RouteContext = {
  params: Promise<{ slug: string }>;
};

function parseFilters(searchParams: URLSearchParams): StateFundBeneficiaryFilters {
  const filters: StateFundBeneficiaryFilters = {};
  const district = searchParams.get("district");
  const sport = searchParams.get("sport");
  const grant = searchParams.get("grant");
  const nursery = searchParams.get("nursery");
  const nis = searchParams.get("nis");
  const search = searchParams.get("search");

  if (district && district !== "all") filters.district = district;
  if (sport && sport !== "all") filters.sport = sport;
  if (grant && grant !== "all") filters.grant = grant as GrantStatusFilter;
  if (nursery && nursery !== "all") filters.nursery = nursery;
  if (nis && nis !== "all") filters.nis = nis;
  if (search?.trim()) filters.search = search.trim();

  return filters;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const auth = await assertStateAdminAccess();
    if ("error" in auth) return auth.error;

    const { slug } = await context.params;
    const { searchParams } = new URL(request.url);
    const offset = Math.max(0, Number(searchParams.get("offset") ?? 0) || 0);
    const limit = Math.min(
      100,
      Math.max(
        1,
        Number(searchParams.get("limit") ?? DEFAULT_SCHEME_BENEFICIARY_PAGE_SIZE) ||
          DEFAULT_SCHEME_BENEFICIARY_PAGE_SIZE
      )
    );

    const result = await listSchemeBeneficiariesPage(slug, {
      filters: parseFilters(searchParams),
      offset,
      limit,
    });

    if (!result) {
      return NextResponse.json({ error: "Scheme not found." }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return handleStateRouteError(error);
  }
}
