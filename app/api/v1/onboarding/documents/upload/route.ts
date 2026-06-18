import { NextResponse } from "next/server";
import type { OnboardingDocumentType } from "@/lib/academy-onboarding";
import { saveVerificationDocument } from "@/lib/academy-verification-upload";
import { loadEnv } from "@/lib/load-env";
import { AuthRequiredError, requireSessionUserId } from "@/lib/auth/server";
import { isStateAdmin } from "@/lib/rbac";
import { getAuthProfile, userHasAcademyMembership } from "@/lib/repositories/auth";
import {
  OnboardingRequestError,
  setOnboardingDocumentKey,
} from "@/lib/repositories/academy-onboarding";

export const runtime = "nodejs";

loadEnv();

const VALID_DOC_TYPES = new Set<OnboardingDocumentType>(["aadhar", "pan", "gst"]);

export async function POST(request: Request) {
  try {
    const userId = await requireSessionUserId();
    const profile = await getAuthProfile(userId);

    if (!profile) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (isStateAdmin(profile.platformRole)) {
      return NextResponse.json(
        { error: "State administrators cannot upload onboarding documents." },
        { status: 403 }
      );
    }

    if (await userHasAcademyMembership(userId)) {
      return NextResponse.json(
        { error: "You already have a verified academy." },
        { status: 409 }
      );
    }

    const formData = await request.formData();
    const docType = String(formData.get("docType") ?? "");
    const file = formData.get("file");

    if (!VALID_DOC_TYPES.has(docType as OnboardingDocumentType)) {
      return NextResponse.json({ error: "Invalid document type." }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Document file is required." }, { status: 400 });
    }

    const saved = await saveVerificationDocument(file, userId, docType as OnboardingDocumentType);
    const updated = await setOnboardingDocumentKey(
      userId,
      docType as OnboardingDocumentType,
      saved.objectKey
    );

    return NextResponse.json({
      request: updated,
      document: {
        docType,
        objectKey: saved.objectKey,
        contentType: saved.contentType,
      },
    });
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof OnboardingRequestError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Could not upload document.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
