import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import {
  assertAcademyApiAccess,
  handleAcademyApiAccessError,
} from "@/lib/auth/assert-academy-api-access";

export const runtime = "nodejs";

loadEnv();

export async function assertAcademyInventoryAccess(academyId: string) {
  const result = await assertAcademyApiAccess(academyId, {
    stateAdminMessage: "State administrators cannot manage academy inventory.",
  });
  if (result instanceof NextResponse) return result;
  return null;
}

export function handleInventoryRouteError(error: unknown) {
  return handleAcademyApiAccessError(error, "Inventory request failed.");
}
