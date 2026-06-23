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
  flagStateNursery,
  clearNurseryFlag,
  approveStateNursery,
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
    await deregisterStateNursery(academyId, auth.userId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleStateRouteError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await assertStateAdminAccess();
    if ("error" in auth) return auth.error;

    const { academyId } = await context.params;
    const body = (await request.json()) as {
      action: "flag" | "clear_flag" | "approve";
      note?: string;
      guidelines?: string;
    };

    if (body.action === "approve") {
      const nursery = await approveStateNursery(academyId, auth.userId);
      return NextResponse.json({ nursery });
    }

    if (body.action === "flag") {
      const nursery = await flagStateNursery(
        academyId,
        { note: body.note ?? "", guidelines: body.guidelines ?? "" },
        auth.userId
      );
      return NextResponse.json({ nursery });
    }

    if (body.action === "clear_flag") {
      const nursery = await clearNurseryFlag(academyId, auth.userId);
      return NextResponse.json({ nursery });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error) {
    return handleStateRouteError(error);
  }
}
