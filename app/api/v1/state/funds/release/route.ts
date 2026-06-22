import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import {
  assertStateAdminAccess,
  handleStateRouteError,
} from "@/app/api/v1/state/nurseries/_auth";
import { releasePendingDisbursements } from "@/lib/repositories/state-fund-disbursements";

export const runtime = "nodejs";

loadEnv();

export async function POST(request: Request) {
  try {
    const auth = await assertStateAdminAccess();
    if ("error" in auth) return auth.error;

    const body = (await request.json().catch(() => ({}))) as {
      schemeSlug?: string;
      disbursementId?: string;
    };
    const result = await releasePendingDisbursements({
      schemeSlug: body.schemeSlug,
      disbursementId: body.disbursementId,
      paidByUserId: auth.userId,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Release failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
