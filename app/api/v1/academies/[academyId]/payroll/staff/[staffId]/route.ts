import { NextResponse } from "next/server";
import {
  validateUpdateStaffPayload,
  type UpdateStaffPayload,
} from "@/lib/payroll";
import {
  deleteStaffMember,
  getStaffMemberForEdit,
  updateStaffMember,
} from "@/lib/repositories/payroll";
import {
  assertAcademyPayrollAccess,
  handlePayrollRouteError,
} from "../../_auth";

type RouteContext = {
  params: Promise<{ academyId: string; staffId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { academyId, staffId } = await context.params;
    const access = await assertAcademyPayrollAccess(academyId);
    if (access instanceof NextResponse) {
      return access;
    }

    const staff = await getStaffMemberForEdit(academyId, staffId);
    return NextResponse.json(staff);
  } catch (error) {
    return handlePayrollRouteError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { academyId, staffId } = await context.params;
    const access = await assertAcademyPayrollAccess(academyId);
    if (access instanceof NextResponse) {
      return access;
    }

    const body = (await request.json()) as UpdateStaffPayload;
    const validationError = validateUpdateStaffPayload(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const result = await updateStaffMember(academyId, staffId, body);
    return NextResponse.json(result);
  } catch (error) {
    return handlePayrollRouteError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { academyId, staffId } = await context.params;
    const access = await assertAcademyPayrollAccess(academyId);
    if (access instanceof NextResponse) {
      return access;
    }

    await deleteStaffMember(academyId, staffId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handlePayrollRouteError(error);
  }
}
