import { NextResponse } from "next/server";
import {
  validateCreateInventoryItemPayload,
  type CreateInventoryItemPayload,
} from "@/lib/inventory";
import { createInventoryItem } from "@/lib/repositories/inventory";
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

    const body = (await request.json()) as CreateInventoryItemPayload;
    const validationError = validateCreateInventoryItemPayload(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const item = await createInventoryItem(academyId, body);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return handleInventoryRouteError(error);
  }
}
