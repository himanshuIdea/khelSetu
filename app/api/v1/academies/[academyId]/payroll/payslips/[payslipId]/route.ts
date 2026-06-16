import { NextResponse } from "next/server";
import {
  validateApprovePayslipPayload,
  type ApprovePayslipPayload,
} from "@/lib/payroll";
import { approvePayslip } from "@/lib/repositories/payroll";
import {
  assertAcademyPayrollAccess,
  handlePayrollRouteError,
} from "../../_auth";

type RouteContext = {
  params: Promise<{ academyId: string; payslipId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { academyId, payslipId } = await context.params;
    const access = await assertAcademyPayrollAccess(academyId);
    if (access instanceof NextResponse) {
      return access;
    }

    const body = (await request.json()) as ApprovePayslipPayload;
    const validationError = validateApprovePayslipPayload(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const result = await approvePayslip(academyId, payslipId, access.userId, body);
    return NextResponse.json(result);
  } catch (error) {
    return handlePayrollRouteError(error);
  }
}
