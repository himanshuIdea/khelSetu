import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import {
  assertAcademyApiAccess,
  assertAcademyWritable,
  handleAcademyApiAccessError,
} from "@/lib/auth/assert-academy-api-access";

export const runtime = "nodejs";

loadEnv();

export async function assertAcademyFeesAccess(
  academyId: string,
  options?: { writable?: boolean }
) {
  const assertFn = options?.writable ? assertAcademyWritable : assertAcademyApiAccess;
  const result = await assertFn(academyId, {
    stateAdminMessage: "State administrators cannot manage academy fees.",
  });
  if (result instanceof NextResponse) return result;
  return null;
}

export function handleFeesRouteError(error: unknown) {
  return handleAcademyApiAccessError(error, "Fees request failed.");
}
