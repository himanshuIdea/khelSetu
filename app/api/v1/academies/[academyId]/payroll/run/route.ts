import { NextResponse } from "next/server";
import { runPayroll } from "@/lib/repositories/payroll";
import {
  assertAcademyPayrollAccess,
  handlePayrollRouteError,
} from "../_auth";

type RouteContext = {
  params: Promise<{ academyId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { academyId } = await context.params;
    const access = await assertAcademyPayrollAccess(academyId, { writable: true });
    if (access instanceof NextResponse) {
      return access;
    }

    const result = await runPayroll(academyId);
    return NextResponse.json(result);
  } catch (error) {
    return handlePayrollRouteError(error);
  }
}
