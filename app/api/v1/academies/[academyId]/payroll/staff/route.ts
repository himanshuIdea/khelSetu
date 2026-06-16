import { NextResponse } from "next/server";
import {
  validateCreateStaffPayload,
  type CreateStaffPayload,
} from "@/lib/payroll";
import { createStaffMember, getStaffMembers } from "@/lib/repositories/payroll";
import {
  assertAcademyPayrollAccess,
  handlePayrollRouteError,
} from "../_auth";

type RouteContext = {
  params: Promise<{ academyId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { academyId } = await context.params;
    const access = await assertAcademyPayrollAccess(academyId);
    if (access instanceof NextResponse) {
      return access;
    }

    const staff = await getStaffMembers(academyId);
    return NextResponse.json(staff);
  } catch (error) {
    return handlePayrollRouteError(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { academyId } = await context.params;
    const access = await assertAcademyPayrollAccess(academyId);
    if (access instanceof NextResponse) {
      return access;
    }

    const body = (await request.json()) as CreateStaffPayload;
    const validationError = validateCreateStaffPayload(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const result = await createStaffMember(academyId, body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handlePayrollRouteError(error);
  }
}
