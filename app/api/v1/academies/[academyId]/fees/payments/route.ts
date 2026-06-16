import { NextResponse } from "next/server";
import {
  validateRecordFeePaymentPayload,
  type RecordFeePaymentPayload,
} from "@/lib/fees";
import { recordFeePayment } from "@/lib/repositories/fees";
import {
  assertAcademyFeesAccess,
  handleFeesRouteError,
} from "../_auth";

type RouteContext = {
  params: Promise<{ academyId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { academyId } = await context.params;
    const accessError = await assertAcademyFeesAccess(academyId);
    if (accessError) {
      return accessError;
    }

    const body = (await request.json()) as RecordFeePaymentPayload;
    const validationError = validateRecordFeePaymentPayload(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const result = await recordFeePayment(academyId, body);
    return NextResponse.json(result);
  } catch (error) {
    return handleFeesRouteError(error);
  }
}
