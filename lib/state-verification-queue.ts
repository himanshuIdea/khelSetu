import {
  ONBOARDING_STATUS_LABELS,
  onboardingStatusVariant,
  type AcademyOnboardingStatus,
} from "@/lib/academy-onboarding";
import {
  type NurseryFlagResponseStatus,
  type NurseryPillVariant,
  type NurseryVerificationStatus,
} from "@/lib/state-nurseries";

export type VerificationQueueOnboardingItem = {
  kind: "onboarding";
  id: string;
  name: string;
  initials: string;
  color: string;
  adminFullName: string;
  district: string;
  queueTypeLabel: "Onboarding";
  athleteCount: null;
  status: AcademyOnboardingStatus;
  statusLabel: string;
  statusVariant: NurseryPillVariant | "grey";
  submittedAt: string | null;
  sortPriority: number;
  sortDate: number;
};

export type VerificationQueueNurseryItem = {
  kind: "nursery";
  academyId: string;
  name: string;
  initials: string;
  color: string;
  adminFullName: string;
  district: string;
  queueTypeLabel: "Registered";
  athleteCount: number;
  verificationStatus: NurseryVerificationStatus;
  statusLabel: string;
  statusVariant: NurseryPillVariant;
  flagResponseStatus: NurseryFlagResponseStatus;
  registeredAt: string | null;
  /** Active onboarding request tied to this academy, if any. */
  onboardingRequestId: string | null;
  sortPriority: number;
  sortDate: number;
};

export type VerificationQueueItem =
  | VerificationQueueOnboardingItem
  | VerificationQueueNurseryItem;

export const ONBOARDING_SORT_PRIORITY: Record<AcademyOnboardingStatus, number> = {
  draft: 99,
  submitted: 0,
  needs_action: 1,
  under_review: 2,
  rejected: 3,
  approved: 99,
};

export const NURSERY_SORT_PRIORITY: Record<NurseryVerificationStatus, number> = {
  flagged: 4,
  pending: 5,
  verified: 6,
};

export function onboardingInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "NA";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export function verificationQueueStatusLabel(item: VerificationQueueItem): string {
  if (item.kind === "onboarding") {
    if (item.status === "submitted" || item.status === "under_review") {
      return "Pending review";
    }
    return ONBOARDING_STATUS_LABELS[item.status];
  }
  if (item.flagResponseStatus === "review_requested") {
    return "Review requested";
  }
  return item.statusLabel;
}

/** Items that need state review (onboarding queue or nursery pending verification). */
export function isPendingReviewQueueItem(item: VerificationQueueItem): boolean {
  if (item.kind === "onboarding") {
    return (
      item.status === "submitted" ||
      item.status === "under_review" ||
      item.status === "needs_action"
    );
  }
  return item.verificationStatus === "pending";
}

export function verificationQueueStatusVariant(
  item: VerificationQueueItem
): NurseryPillVariant | "grey" {
  if (item.kind === "onboarding") {
    return item.statusVariant;
  }
  if (item.flagResponseStatus === "review_requested") {
    return "amber";
  }
  return item.statusVariant;
}

export { onboardingStatusVariant };
