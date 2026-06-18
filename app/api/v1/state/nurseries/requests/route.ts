import { NextResponse } from "next/server";
import type {
  AcademyOnboardingRequestType,
  AcademyOnboardingStatus,
} from "@/lib/academy-onboarding";
import { loadEnv } from "@/lib/load-env";
import {
  assertStateAdminAccess,
  handleStateRouteError,
} from "@/app/api/v1/state/nurseries/_auth";
import { listStateOnboardingRequests } from "@/lib/repositories/academy-onboarding";

export const runtime = "nodejs";

loadEnv();

export async function GET(request: Request) {
  try {
    const auth = await assertStateAdminAccess();
    if ("error" in auth) return auth.error;

    const { searchParams } = new URL(request.url);
    const status = (searchParams.get("status") ?? "all") as AcademyOnboardingStatus | "all";
    const requestType = (searchParams.get("requestType") ?? "all") as
      | AcademyOnboardingRequestType
      | "all";
    const district = searchParams.get("district") ?? "all";
    const daysParam = searchParams.get("days") ?? "all";
    const days: number | "all" =
      daysParam === "all" ? "all" : Number.parseInt(daysParam, 10);

    const requests = await listStateOnboardingRequests({
      status,
      requestType,
      district,
      days: typeof days === "number" && Number.isFinite(days) && days > 0 ? days : "all",
    });

    return NextResponse.json({ requests });
  } catch (error) {
    return handleStateRouteError(error);
  }
}
