import { NextResponse } from "next/server";
import {
  assertAcademyApiAccess,
  assertAcademyWritable,
  handleAcademyApiAccessError,
} from "@/lib/auth/assert-academy-api-access";

export async function assertAcademyCoachAccess(
  academyId: string,
  options?: { writable?: boolean }
) {
  const assertFn = options?.writable ? assertAcademyWritable : assertAcademyApiAccess;
  const result = await assertFn(academyId, {
    stateAdminMessage: "State administrators cannot manage academy coaches.",
  });
  if (result instanceof NextResponse) return result;
  return null;
}

export function handleCoachRouteError(error: unknown) {
  return handleAcademyApiAccessError(error, "Coach request failed.");
}
