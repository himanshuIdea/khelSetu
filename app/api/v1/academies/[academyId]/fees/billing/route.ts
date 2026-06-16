import { NextResponse } from "next/server";
import type { FeeBillingFilters } from "@/lib/fees";
import { listPlayerFeeBilling } from "@/lib/repositories/fees";
import {
  assertAcademyFeesAccess,
  handleFeesRouteError,
} from "../_auth";

type RouteContext = {
  params: Promise<{ academyId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { academyId } = await context.params;
    const accessError = await assertAcademyFeesAccess(academyId);
    if (accessError) {
      return accessError;
    }

    const url = new URL(request.url);
    const filters: FeeBillingFilters = {};
    const sportId = url.searchParams.get("sportId");
    const batchId = url.searchParams.get("batchId");
    const status = url.searchParams.get("status");

    if (sportId) filters.sportId = sportId;
    if (batchId) filters.batchId = batchId;
    if (status === "due" || status === "paid" || status === "overdue" || status === "all") {
      filters.status = status;
    }

    const rows = await listPlayerFeeBilling(academyId, filters);
    return NextResponse.json(rows);
  } catch (error) {
    return handleFeesRouteError(error);
  }
}
