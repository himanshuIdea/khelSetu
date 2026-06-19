import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import {
  assertStateAdminAccess,
  handleStateRouteError,
} from "@/app/api/v1/state/nurseries/_auth";
import { updateFiscalYearTotalAllocation } from "@/lib/repositories/state-funds";

export const runtime = "nodejs";

loadEnv();

export async function PATCH(request: Request) {
  try {
    const auth = await assertStateAdminAccess();
    if ("error" in auth) return auth.error;

    const body = (await request.json()) as { totalAllocatedAmountPaise?: number };
    if (
      typeof body.totalAllocatedAmountPaise !== "number" ||
      !Number.isFinite(body.totalAllocatedAmountPaise)
    ) {
      return NextResponse.json({ error: "totalAllocatedAmountPaise is required." }, { status: 400 });
    }

    const updated = await updateFiscalYearTotalAllocation(
      Math.round(body.totalAllocatedAmountPaise)
    );
    return NextResponse.json({
      ok: true,
      fiscalYear: {
        id: updated.id,
        label: updated.label,
        totalAllocatedAmountPaise: updated.totalAllocatedAmountPaise,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
