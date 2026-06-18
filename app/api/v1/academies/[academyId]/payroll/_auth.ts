import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import {
  assertAcademyApiAccess,
  handleAcademyApiAccessError,
} from "@/lib/auth/assert-academy-api-access";

export const runtime = "nodejs";

loadEnv();

export async function assertAcademyPayrollAccess(academyId: string) {
  return assertAcademyApiAccess(academyId, {
    stateAdminMessage: "State administrators cannot manage academy payroll.",
  });
}

export function handlePayrollRouteError(error: unknown) {
  return handleAcademyApiAccessError(error, "Payroll request failed.");
}
