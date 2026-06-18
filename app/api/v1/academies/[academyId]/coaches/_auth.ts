import { NextResponse } from "next/server";
import {
  assertAcademyApiAccess,
  handleAcademyApiAccessError,
} from "@/lib/auth/assert-academy-api-access";

export async function assertAcademyCoachAccess(academyId: string) {
  const result = await assertAcademyApiAccess(academyId, {
    stateAdminMessage: "State administrators cannot manage academy coaches.",
  });
  if (result instanceof NextResponse) return result;
  return null;
}

export function handleCoachRouteError(error: unknown) {
  return handleAcademyApiAccessError(error, "Coach request failed.");
}
