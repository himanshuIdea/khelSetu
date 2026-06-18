import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import {
  assertAcademyApiAccess,
  handleAcademyApiAccessError,
} from "@/lib/auth/assert-academy-api-access";

export const runtime = "nodejs";

loadEnv();

export async function assertAcademyFeesAccess(academyId: string) {
  const result = await assertAcademyApiAccess(academyId, {
    stateAdminMessage: "State administrators cannot manage academy fees.",
  });
  if (result instanceof NextResponse) return result;
  return null;
}

export function handleFeesRouteError(error: unknown) {
  return handleAcademyApiAccessError(error, "Fees request failed.");
}
