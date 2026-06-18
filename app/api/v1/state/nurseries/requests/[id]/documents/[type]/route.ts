import { NextResponse } from "next/server";
import type { OnboardingDocumentType } from "@/lib/academy-onboarding";
import { readVerificationDocument } from "@/lib/academy-verification-upload";
import { loadEnv } from "@/lib/load-env";
import {
  assertStateAdminAccess,
  handleStateRouteError,
} from "@/app/api/v1/state/nurseries/_auth";
import { getOnboardingDocumentKey } from "@/lib/repositories/academy-onboarding";

export const runtime = "nodejs";

loadEnv();

const VALID_DOC_TYPES = new Set<OnboardingDocumentType>(["aadhar", "pan", "gst"]);

type RouteParams = { params: Promise<{ id: string; type: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const auth = await assertStateAdminAccess();
    if ("error" in auth) return auth.error;

    const { id, type } = await params;
    if (!VALID_DOC_TYPES.has(type as OnboardingDocumentType)) {
      return NextResponse.json({ error: "Invalid document type." }, { status: 400 });
    }

    const objectKey = await getOnboardingDocumentKey(id, type as OnboardingDocumentType);
    if (!objectKey) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    const { buffer, contentType } = await readVerificationDocument(objectKey);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${type}-document"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return handleStateRouteError(error);
  }
}
