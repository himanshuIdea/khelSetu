import { NextResponse } from "next/server";
import type { OnboardingRequiredAction } from "@/lib/academy-onboarding";
import { loadEnv } from "@/lib/load-env";
import {
  assertStateAdminAccess,
  handleStateRouteError,
} from "@/app/api/v1/state/nurseries/_auth";
import {
  getOnboardingRequestById,
  OnboardingRequestError,
  reviewOnboardingRequest,
} from "@/lib/repositories/academy-onboarding";

export const runtime = "nodejs";

loadEnv();

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const auth = await assertStateAdminAccess();
    if ("error" in auth) return auth.error;

    const { id } = await params;
    const request = await getOnboardingRequestById(id);

    if (!request) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }

    const { userId: _userId, ...detail } = request;
    return NextResponse.json({ request: detail });
  } catch (error) {
    return handleStateRouteError(error);
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const auth = await assertStateAdminAccess();
    if ("error" in auth) return auth.error;

    const { id } = await params;
    const body = (await request.json()) as {
      action: "approve" | "needs_action" | "reject";
      reviewNotes?: string;
      requiredActions?: OnboardingRequiredAction[];
    };

    if (!body.action) {
      return NextResponse.json({ error: "Action is required." }, { status: 400 });
    }

    const updated = await reviewOnboardingRequest({
      requestId: id,
      reviewerUserId: auth.userId,
      action: body.action,
      reviewNotes: body.reviewNotes,
      requiredActions: body.requiredActions,
    });

    return NextResponse.json({ request: updated });
  } catch (error) {
    if (error instanceof OnboardingRequestError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return handleStateRouteError(error);
  }
}
