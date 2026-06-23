import { NextResponse } from "next/server";
import { validateIssueGearPayload, type IssueGearPayload } from "@/lib/inventory";
import { issueGear } from "@/lib/repositories/inventory";
import {
  assertAcademyInventoryAccess,
  handleInventoryRouteError,
} from "../_auth";

type RouteContext = {
  params: Promise<{ academyId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { academyId } = await context.params;
    const accessError = await assertAcademyInventoryAccess(academyId, { writable: true });
    if (accessError) {
      return accessError;
    }

    const body = (await request.json()) as IssueGearPayload;
    const validationError = validateIssueGearPayload(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const issue = await issueGear(academyId, body);
    return NextResponse.json(issue, { status: 201 });
  } catch (error) {
    return handleInventoryRouteError(error);
  }
}
