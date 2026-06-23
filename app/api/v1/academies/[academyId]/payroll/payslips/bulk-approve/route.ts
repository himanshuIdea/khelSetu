import { NextResponse } from "next/server";
import {
  validateBulkApprovePayload,
  type BulkApprovePayslipsPayload,
} from "@/lib/payroll";
import { bulkApprovePayslips } from "@/lib/repositories/payroll";
import {
  assertAcademyPayrollAccess,
  handlePayrollRouteError,
} from "../../_auth";

type RouteContext = {
  params: Promise<{ academyId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { academyId } = await context.params;
    const access = await assertAcademyPayrollAccess(academyId, { writable: true });
    if (access instanceof NextResponse) {
      return access;
    }

    const body = (await request.json()) as BulkApprovePayslipsPayload;
    const validationError = validateBulkApprovePayload(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const result = await bulkApprovePayslips(
      academyId,
      body.payslipIds,
      access.userId,
      body.paymentReference
    );
    return NextResponse.json(result);
  } catch (error) {
    return handlePayrollRouteError(error);
  }
}
