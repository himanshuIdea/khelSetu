import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import {
  assertStateAdminAccess,
  handleStateRouteError,
} from "@/app/api/v1/state/nurseries/_auth";
import { getSchemeBySlug, updateSchemeAllocation } from "@/lib/repositories/state-funds";

export const runtime = "nodejs";

loadEnv();

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await assertStateAdminAccess();
    if ("error" in auth) return auth.error;

    const { slug } = await context.params;
    const scheme = await getSchemeBySlug(slug);
    if (!scheme) {
      return NextResponse.json({ error: "Scheme not found." }, { status: 404 });
    }

    const body = (await request.json()) as { allocatedAmountPaise?: number };
    if (typeof body.allocatedAmountPaise !== "number" || !Number.isFinite(body.allocatedAmountPaise)) {
      return NextResponse.json({ error: "allocatedAmountPaise is required." }, { status: 400 });
    }

    const updated = await updateSchemeAllocation(scheme.id, Math.round(body.allocatedAmountPaise));
    return NextResponse.json({
      ok: true,
      scheme: {
        id: updated.id,
        slug: updated.slug,
        allocatedAmountPaise: updated.allocatedAmountPaise,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
