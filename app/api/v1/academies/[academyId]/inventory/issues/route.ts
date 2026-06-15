import { NextResponse } from "next/server";
import { listOpenGearIssues } from "@/lib/repositories/inventory";
import {
  assertAcademyInventoryAccess,
  handleInventoryRouteError,
} from "../_auth";

type RouteContext = {
  params: Promise<{ academyId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { academyId } = await context.params;
    const accessError = await assertAcademyInventoryAccess(academyId);
    if (accessError) {
      return accessError;
    }

    const issues = await listOpenGearIssues(academyId);
    return NextResponse.json(issues);
  } catch (error) {
    return handleInventoryRouteError(error);
  }
}
