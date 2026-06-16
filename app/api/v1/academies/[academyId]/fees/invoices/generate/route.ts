import { NextResponse } from "next/server";
import { generateInvoicesForPeriod } from "@/lib/repositories/fees";
import {
  assertAcademyFeesAccess,
  handleFeesRouteError,
} from "../../_auth";

type RouteContext = {
  params: Promise<{ academyId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { academyId } = await context.params;
    const accessError = await assertAcademyFeesAccess(academyId);
    if (accessError) {
      return accessError;
    }

    const result = await generateInvoicesForPeriod(academyId);
    return NextResponse.json(result);
  } catch (error) {
    return handleFeesRouteError(error);
  }
}
