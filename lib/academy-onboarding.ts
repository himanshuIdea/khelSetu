import type { OnboardingPayload } from "@/lib/onboarding";

export type AcademyOnboardingStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "needs_action"
  | "approved"
  | "rejected";

export type AcademyOnboardingRequestType = "initial" | "resubmission";

export type OnboardingDocumentType = "aadhar" | "pan" | "gst";

export const ONBOARDING_REQUIRED_ACTIONS = [
  "academy_name",
  "district",
  "slug",
  "sports",
  "funding_type",
  "brand_color",
  "aadhar_number",
  "aadhar_document",
  "pan_number",
  "pan_document",
  "gst_number",
  "gst_document",
] as const;

export type OnboardingRequiredAction = (typeof ONBOARDING_REQUIRED_ACTIONS)[number];

export type AcademyOnboardingDraftPayload = OnboardingPayload & {
  aadharNumber: string;
  panNumber: string;
  gstNumber: string;
};

export type AcademyOnboardingRequestSummary = {
  id: string;
  status: AcademyOnboardingStatus;
  requestType: AcademyOnboardingRequestType;
  requiredActions: string[];
  reviewNotes: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  academyId: string | null;
};

export type AcademyOnboardingRequestDetail = AcademyOnboardingRequestSummary & {
  academyName: string | null;
  district: string | null;
  slug: string | null;
  sports: string[];
  fundingType: "govt_aided" | "private";
  brandColor: string;
  aadharNumber: string | null;
  panNumber: string | null;
  gstNumber: string | null;
  hasAadharDocument: boolean;
  hasPanDocument: boolean;
  hasGstDocument: boolean;
  adminFullName: string;
  adminEmail: string | null;
};

export type StateOnboardingRequestListItem = {
  id: string;
  academyName: string;
  district: string;
  adminFullName: string;
  requestType: AcademyOnboardingRequestType;
  status: AcademyOnboardingStatus;
  submittedAt: string | null;
  statusLabel: string;
  statusVariant: "green" | "amber" | "red" | "grey";
};

export const ONBOARDING_STATUS_LABELS: Record<AcademyOnboardingStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under review",
  needs_action: "Needs action",
  approved: "Approved",
  rejected: "Rejected",
};

export function onboardingStatusVariant(
  status: AcademyOnboardingStatus
): StateOnboardingRequestListItem["statusVariant"] {
  switch (status) {
    case "approved":
      return "green";
    case "submitted":
    case "under_review":
      return "amber";
    case "needs_action":
    case "rejected":
      return "red";
    default:
      return "grey";
  }
}

export function normalizeAadharNumber(value: string): string {
  return value.replace(/\D/g, "").slice(0, 12);
}

export function validateAadharNumber(value: string): string | null {
  const digits = normalizeAadharNumber(value);
  if (digits.length !== 12) return "Aadhaar number must be 12 digits.";
  return null;
}

export function normalizePanNumber(value: string): string {
  return value.trim().toUpperCase().replace(/\s/g, "");
}

export function validatePanNumber(value: string): string | null {
  const pan = normalizePanNumber(value);
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
    return "PAN must be in format ABCDE1234F.";
  }
  return null;
}

export function normalizeGstNumber(value: string): string {
  return value.trim().toUpperCase().replace(/\s/g, "");
}

export function validateGstNumber(value: string): string | null {
  const gst = normalizeGstNumber(value);
  if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gst)) {
    return "GSTIN format is invalid.";
  }
  return null;
}

export function validateOnboardingKyc(payload: {
  aadharNumber: string;
  panNumber: string;
  gstNumber: string;
  aadharDocumentKey?: string | null;
  panDocumentKey?: string | null;
  gstDocumentKey?: string | null;
}): string | null {
  const aadharError = validateAadharNumber(payload.aadharNumber);
  if (aadharError) return aadharError;

  const panError = validatePanNumber(payload.panNumber);
  if (panError) return panError;

  const gstError = validateGstNumber(payload.gstNumber);
  if (gstError) return gstError;

  if (!payload.aadharDocumentKey) return "Upload your Aadhaar card.";
  if (!payload.panDocumentKey) return "Upload your PAN card.";
  if (!payload.gstDocumentKey) return "Upload your GST certificate.";

  return null;
}

export function isEditableOnboardingStatus(status: AcademyOnboardingStatus): boolean {
  return status === "draft" || status === "needs_action";
}

export function canResubmitOnboardingStatus(status: AcademyOnboardingStatus): boolean {
  return status === "draft" || status === "needs_action";
}
