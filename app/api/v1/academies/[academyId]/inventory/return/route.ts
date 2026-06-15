import { NextResponse } from "next/server";
import { validateReturnGearPayload, type ReturnGearPayload } from "@/lib/inventory";
import { returnGear } from "@/lib/repositories/inventory";
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
    const accessError = await assertAcademyInventoryAccess(academyId);
    if (accessError) {
      return accessError;
    }

    const body = (await request.json()) as ReturnGearPayload;
    const validationError = validateReturnGearPayload(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const result = await returnGear(academyId, body);
    return NextResponse.json(result);
  } catch (error) {
    return handleInventoryRouteError(error);
  }
}
