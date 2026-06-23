import { NextResponse } from "next/server";
import {
  validateUpdateInventoryItemPayload,
  type UpdateInventoryItemPayload,
} from "@/lib/inventory";
import { deleteInventoryItem, updateInventoryItem } from "@/lib/repositories/inventory";
import {
  assertAcademyInventoryAccess,
  handleInventoryRouteError,
} from "../../_auth";

type RouteContext = {
  params: Promise<{ academyId: string; itemId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { academyId, itemId } = await context.params;
    const accessError = await assertAcademyInventoryAccess(academyId, { writable: true });
    if (accessError) {
      return accessError;
    }

    const body = (await request.json()) as UpdateInventoryItemPayload;
    const validationError = validateUpdateInventoryItemPayload(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const item = await updateInventoryItem(academyId, itemId, body);
    return NextResponse.json(item);
  } catch (error) {
    return handleInventoryRouteError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { academyId, itemId } = await context.params;
    const accessError = await assertAcademyInventoryAccess(academyId, { writable: true });
    if (accessError) {
      return accessError;
    }

    await deleteInventoryItem(academyId, itemId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleInventoryRouteError(error);
  }
}
