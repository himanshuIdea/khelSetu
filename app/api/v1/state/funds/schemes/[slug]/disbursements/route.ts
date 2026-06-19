import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import {
  assertStateAdminAccess,
  handleStateRouteError,
} from "@/app/api/v1/state/nurseries/_auth";
import { createDisbursement } from "@/lib/repositories/state-fund-disbursements";
import { getSchemeBySlug } from "@/lib/repositories/state-funds";

export const runtime = "nodejs";

loadEnv();

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const auth = await assertStateAdminAccess();
    if ("error" in auth) return auth.error;

    const { slug } = await context.params;
    const scheme = await getSchemeBySlug(slug);
    if (!scheme) {
      return NextResponse.json({ error: "Scheme not found." }, { status: 404 });
    }

    const body = (await request.json()) as {
      beneficiaryId?: string;
      amountPaise?: number;
      status?: "pending" | "paid";
      dueDate?: string | null;
      referenceNote?: string;
    };

    if (!body.beneficiaryId) {
      return NextResponse.json({ error: "beneficiaryId is required." }, { status: 400 });
    }
    if (typeof body.amountPaise !== "number" || body.amountPaise <= 0) {
      return NextResponse.json({ error: "amountPaise must be a positive number." }, { status: 400 });
    }
    if (body.status !== "pending" && body.status !== "paid") {
      return NextResponse.json({ error: "status must be pending or paid." }, { status: 400 });
    }

    const disbursement = await createDisbursement({
      schemeSlug: slug,
      beneficiaryId: body.beneficiaryId,
      amountPaise: Math.round(body.amountPaise),
      status: body.status,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      referenceNote: body.referenceNote,
      createdByUserId: auth.userId,
    });

    return NextResponse.json({ ok: true, disbursement });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Grant failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
