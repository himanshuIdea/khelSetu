import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import {
  assertStateAdminAccess,
  handleStateRouteError,
} from "@/app/api/v1/state/nurseries/_auth";
import { getSchemeDetailWithBeneficiaries } from "@/lib/repositories/state-funds";

export const runtime = "nodejs";

loadEnv();

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const auth = await assertStateAdminAccess();
    if ("error" in auth) return auth.error;

    const { slug } = await context.params;
    const detail = await getSchemeDetailWithBeneficiaries(slug);
    if (!detail) {
      return NextResponse.json({ error: "Scheme not found." }, { status: 404 });
    }

    return NextResponse.json({ detail });
  } catch (error) {
    return handleStateRouteError(error);
  }
}
