import { NextResponse } from "next/server";
import { loadEnv } from "@/lib/load-env";
import {
  assertStateAdminAccess,
  handleStateRouteError,
} from "@/app/api/v1/state/nurseries/_auth";
import {
  deregisterStateNursery,
  getStateNurseryDetail,
  getUnregisteredAcademyPreview,
} from "@/lib/repositories/state-nurseries";

export const runtime = "nodejs";

loadEnv();

type RouteContext = {
  params: Promise<{ academyId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const auth = await assertStateAdminAccess();
    if ("error" in auth) return auth.error;

    const { academyId } = await context.params;
    const registered = await getStateNurseryDetail(academyId);
    if (registered) {
      return NextResponse.json({ nursery: registered, registered: true });
    }

    const preview = await getUnregisteredAcademyPreview(academyId);
    if (!preview) {
      return NextResponse.json({ error: "Academy not found." }, { status: 404 });
    }

    return NextResponse.json({ nursery: preview, registered: false });
  } catch (error) {
    return handleStateRouteError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const auth = await assertStateAdminAccess();
    if ("error" in auth) return auth.error;

    const { academyId } = await context.params;
    await deregisterStateNursery(academyId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleStateRouteError(error);
  }
}
