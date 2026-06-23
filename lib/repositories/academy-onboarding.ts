import { cache } from "react";
import { and, desc, eq, gte, ne, sql } from "drizzle-orm";
import { academyMemberships, academyOnboardingRequests, academies, users } from "@/db/schema";
import {
  type AcademyOnboardingDraftPayload,
  type AcademyOnboardingRequestDetail,
  type AcademyOnboardingRequestSummary,
  type AcademyOnboardingRequestType,
  type AcademyOnboardingStatus,
  type OnboardingDocumentType,
  type OnboardingRequiredAction,
  type StateOnboardingRequestListItem,
  canResubmitOnboardingStatus,
  isEditableOnboardingStatus,
  normalizeAadharNumber,
  normalizeGstNumber,
  normalizePanNumber,
  onboardingStatusVariant,
  ONBOARDING_STATUS_LABELS,
  validateOnboardingKyc,
} from "@/lib/academy-onboarding";
import { db, isUniqueViolation, SlugTakenError } from "@/lib/db";
import { validateOnboardingPayload } from "@/lib/onboarding";
import { createAcademyProfile, isSlugAvailable, updateAcademyProfileFromOnboarding } from "@/lib/repositories/onboarding";
import { ensureStateNurseryRegistered } from "@/lib/repositories/state-nurseries";

export class OnboardingRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OnboardingRequestError";
  }
}

type RequestRow = typeof academyOnboardingRequests.$inferSelect;

function mapSummary(row: RequestRow): AcademyOnboardingRequestSummary {
  return {
    id: row.id,
    status: row.status as AcademyOnboardingStatus,
    requestType: row.requestType as AcademyOnboardingRequestType,
    requiredActions: (row.requiredActions as string[]) ?? [],
    reviewNotes: row.reviewNotes,
    submittedAt: row.submittedAt?.toISOString() ?? null,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    academyId: row.academyId,
  };
}

function mapDetail(row: RequestRow, admin: { fullName: string; email: string | null }): AcademyOnboardingRequestDetail {
  return {
    ...mapSummary(row),
    academyName: row.academyName,
    district: row.district,
    slug: row.slug,
    sports: (row.sports as string[]) ?? [],
    fundingType: row.fundingType,
    brandColor: row.brandColor,
    aadharNumber: row.aadharNumber,
    panNumber: row.panNumber,
    gstNumber: row.gstNumber,
    hasAadharDocument: Boolean(row.aadharDocumentKey),
    hasPanDocument: Boolean(row.panDocumentKey),
    hasGstDocument: Boolean(row.gstDocumentKey),
    adminFullName: admin.fullName,
    adminEmail: admin.email,
  };
}

export async function getOnboardingRequestByUserId(
  userId: string
): Promise<AcademyOnboardingRequestDetail | null> {
  const [row] = await db
    .select()
    .from(academyOnboardingRequests)
    .where(eq(academyOnboardingRequests.userId, userId))
    .limit(1);

  if (!row) return null;

  const [admin] = await db
    .select({ fullName: users.fullName, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return mapDetail(row, admin ?? { fullName: "Academy admin", email: null });
}

export async function getOnboardingRequestById(
  requestId: string
): Promise<(AcademyOnboardingRequestDetail & { userId: string }) | null> {
  const [row] = await db
    .select()
    .from(academyOnboardingRequests)
    .where(eq(academyOnboardingRequests.id, requestId))
    .limit(1);

  if (!row) return null;

  const [admin] = await db
    .select({ fullName: users.fullName, email: users.email })
    .from(users)
    .where(eq(users.id, row.userId))
    .limit(1);

  return {
    ...mapDetail(row, admin ?? { fullName: "Academy admin", email: null }),
    userId: row.userId,
  };
}

async function isSlugAvailableForOnboarding(
  slug: string,
  userId: string,
  academyId?: string | null
): Promise<boolean> {
  const academyAvailable = await isSlugAvailable(slug, academyId ?? undefined);
  if (!academyAvailable) return false;

  const [conflict] = await db
    .select({ id: academyOnboardingRequests.id })
    .from(academyOnboardingRequests)
    .where(
      and(
        eq(academyOnboardingRequests.slug, slug),
        ne(academyOnboardingRequests.userId, userId),
        ne(academyOnboardingRequests.status, "approved"),
        ne(academyOnboardingRequests.status, "rejected")
      )
    )
    .limit(1);

  return !conflict;
}

export async function upsertOnboardingDraft(
  userId: string,
  payload: AcademyOnboardingDraftPayload
): Promise<AcademyOnboardingRequestDetail> {
  const profileError = validateOnboardingPayload(payload);
  if (profileError) {
    throw new OnboardingRequestError(profileError);
  }

  const existing = await getOnboardingRequestByUserId(userId);
  if (existing && !isEditableOnboardingStatus(existing.status)) {
    throw new OnboardingRequestError("This request cannot be edited in its current status.");
  }

  const slugAvailable = await isSlugAvailableForOnboarding(payload.slug, userId, existing?.academyId);
  if (!slugAvailable) {
    throw new OnboardingRequestError("This branded link is already taken.");
  }

  const values = {
    userId,
    academyName: payload.academyName.trim(),
    district: payload.district.trim(),
    slug: payload.slug,
    sports: payload.sports,
    fundingType: payload.fundingType,
    brandColor: payload.brandColor,
    aadharNumber: normalizeAadharNumber(payload.aadharNumber),
    panNumber: normalizePanNumber(payload.panNumber),
    gstNumber: normalizeGstNumber(payload.gstNumber),
    updatedAt: new Date(),
  };

  if (existing) {
    const [row] = await db
      .update(academyOnboardingRequests)
      .set(values)
      .where(eq(academyOnboardingRequests.id, existing.id))
      .returning();

    const [admin] = await db
      .select({ fullName: users.fullName, email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return mapDetail(row, admin ?? { fullName: "Academy admin", email: null });
  }

  const [row] = await db
    .insert(academyOnboardingRequests)
    .values({
      ...values,
      status: "draft",
      requestType: "initial",
    })
    .returning();

  const [admin] = await db
    .select({ fullName: users.fullName, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return mapDetail(row, admin ?? { fullName: "Academy admin", email: null });
}

export async function setOnboardingDocumentKey(
  userId: string,
  docType: OnboardingDocumentType,
  objectKey: string
): Promise<AcademyOnboardingRequestDetail> {
  const existing = await getOnboardingRequestByUserId(userId);
  if (!existing) {
    throw new OnboardingRequestError("Save your onboarding draft before uploading documents.");
  }
  if (!isEditableOnboardingStatus(existing.status)) {
    throw new OnboardingRequestError("Documents cannot be changed in the current status.");
  }

  const patch =
    docType === "aadhar"
      ? { aadharDocumentKey: objectKey }
      : docType === "pan"
        ? { panDocumentKey: objectKey }
        : { gstDocumentKey: objectKey };

  const [row] = await db
    .update(academyOnboardingRequests)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(academyOnboardingRequests.id, existing.id))
    .returning();

  const [admin] = await db
    .select({ fullName: users.fullName, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return mapDetail(row, admin ?? { fullName: "Academy admin", email: null });
}

export async function submitOnboardingRequest(
  userId: string
): Promise<AcademyOnboardingRequestDetail> {
  const existing = await getOnboardingRequestByUserId(userId);
  if (!existing) {
    throw new OnboardingRequestError("Complete the onboarding form before submitting.");
  }

  if (!canResubmitOnboardingStatus(existing.status)) {
    throw new OnboardingRequestError("This request has already been submitted.");
  }

  const profileError = validateOnboardingPayload({
    academyName: existing.academyName ?? "",
    district: existing.district ?? "",
    slug: existing.slug ?? "",
    sports: existing.sports,
    fundingType: existing.fundingType,
    brandColor: existing.brandColor,
  });
  if (profileError) {
    throw new OnboardingRequestError(profileError);
  }

  const kycError = validateOnboardingKyc({
    aadharNumber: existing.aadharNumber ?? "",
    panNumber: existing.panNumber ?? "",
    gstNumber: existing.gstNumber ?? "",
    aadharDocumentKey: existing.hasAadharDocument ? "set" : null,
    panDocumentKey: existing.hasPanDocument ? "set" : null,
    gstDocumentKey: existing.hasGstDocument ? "set" : null,
  });
  if (kycError) {
    throw new OnboardingRequestError(kycError);
  }

  const slugAvailable = await isSlugAvailableForOnboarding(existing.slug ?? "", userId, existing.academyId);
  if (!slugAvailable) {
    throw new OnboardingRequestError("This branded link is already taken.");
  }

  const isResubmission =
    existing.status === "needs_action" ||
    (existing.status === "draft" && existing.requestType === "resubmission");

  const [row] = await db
    .update(academyOnboardingRequests)
    .set({
      status: "submitted",
      requestType: isResubmission ? "resubmission" : existing.requestType,
      submittedAt: new Date(),
      reviewNotes: isResubmission ? existing.reviewNotes : null,
      requiredActions: isResubmission ? existing.requiredActions : [],
      updatedAt: new Date(),
    })
    .where(eq(academyOnboardingRequests.id, existing.id))
    .returning();

  const [admin] = await db
    .select({ fullName: users.fullName, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return mapDetail(row, admin ?? { fullName: "Academy admin", email: null });
}

export type StateOnboardingListFilters = {
  status?: AcademyOnboardingStatus | "all";
  requestType?: AcademyOnboardingRequestType | "all";
  district?: string | "all";
  days?: number | "all";
};

/** Lightweight gate for report availability — avoids loading full onboarding list on SSR. */
export const hasPendingOnboardingRequests = cache(async (): Promise<boolean> => {
  const row = await db
    .select({ count: sql<number>`count(*)` })
    .from(academyOnboardingRequests)
    .where(
      and(
        ne(academyOnboardingRequests.status, "draft"),
        ne(academyOnboardingRequests.status, "approved")
      )
    );
  return Number(row[0]?.count ?? 0) > 0;
});

export const listStateOnboardingRequests = cache(async (
  filters: StateOnboardingListFilters = {}
): Promise<StateOnboardingRequestListItem[]> => {
  const conditions = [ne(academyOnboardingRequests.status, "draft")];

  if (filters.status && filters.status !== "all") {
    conditions.push(eq(academyOnboardingRequests.status, filters.status));
  }

  if (filters.requestType && filters.requestType !== "all") {
    conditions.push(eq(academyOnboardingRequests.requestType, filters.requestType));
  }

  if (filters.district && filters.district !== "all") {
    conditions.push(eq(academyOnboardingRequests.district, filters.district));
  }

  if (filters.days && filters.days !== "all") {
    const since = new Date();
    since.setDate(since.getDate() - filters.days);
    conditions.push(gte(academyOnboardingRequests.submittedAt, since));
  }

  const rows = await db
    .select({
      id: academyOnboardingRequests.id,
      academyName: academyOnboardingRequests.academyName,
      district: academyOnboardingRequests.district,
      adminFullName: users.fullName,
      requestType: academyOnboardingRequests.requestType,
      status: academyOnboardingRequests.status,
      submittedAt: academyOnboardingRequests.submittedAt,
    })
    .from(academyOnboardingRequests)
    .innerJoin(users, eq(academyOnboardingRequests.userId, users.id))
    .where(and(...conditions))
    .orderBy(desc(academyOnboardingRequests.submittedAt));

  return rows.map((row) => {
    const status = row.status as AcademyOnboardingStatus;
    return {
      id: row.id,
      academyName: row.academyName ?? "Unnamed academy",
      district: row.district ?? "—",
      adminFullName: row.adminFullName,
      requestType: row.requestType as AcademyOnboardingRequestType,
      status,
      submittedAt: row.submittedAt?.toISOString() ?? null,
      statusLabel: ONBOARDING_STATUS_LABELS[status],
      statusVariant: onboardingStatusVariant(status),
    };
  });
});

export async function getOnboardingDocumentKey(
  requestId: string,
  docType: OnboardingDocumentType
): Promise<string | null> {
  const [row] = await db
    .select({
      aadharDocumentKey: academyOnboardingRequests.aadharDocumentKey,
      panDocumentKey: academyOnboardingRequests.panDocumentKey,
      gstDocumentKey: academyOnboardingRequests.gstDocumentKey,
    })
    .from(academyOnboardingRequests)
    .where(eq(academyOnboardingRequests.id, requestId))
    .limit(1);

  if (!row) return null;

  if (docType === "aadhar") return row.aadharDocumentKey;
  if (docType === "pan") return row.panDocumentKey;
  return row.gstDocumentKey;
}

export async function reviewOnboardingRequest(input: {
  requestId: string;
  reviewerUserId: string;
  action: "approve" | "needs_action" | "reject";
  reviewNotes?: string;
  requiredActions?: OnboardingRequiredAction[];
}): Promise<AcademyOnboardingRequestDetail> {
  const request = await getOnboardingRequestById(input.requestId);
  if (!request) {
    throw new OnboardingRequestError("Onboarding request not found.");
  }

  if (request.status === "approved" || request.status === "rejected") {
    throw new OnboardingRequestError("This request has already been finalized.");
  }

  if (input.action === "approve") {
    const profileError = validateOnboardingPayload({
      academyName: request.academyName ?? "",
      district: request.district ?? "",
      slug: request.slug ?? "",
      sports: request.sports,
      fundingType: request.fundingType,
      brandColor: request.brandColor,
    });
    if (profileError) {
      throw new OnboardingRequestError(profileError);
    }

    const kycError = validateOnboardingKyc({
      aadharNumber: request.aadharNumber ?? "",
      panNumber: request.panNumber ?? "",
      gstNumber: request.gstNumber ?? "",
      aadharDocumentKey: request.hasAadharDocument ? "set" : null,
      panDocumentKey: request.hasPanDocument ? "set" : null,
      gstDocumentKey: request.hasGstDocument ? "set" : null,
    });
    if (kycError) {
      throw new OnboardingRequestError(kycError);
    }

    try {
      let approvedAcademyId = request.academyId;

      if (approvedAcademyId) {
        const [academyRow] = await db
          .select({ nurseryDeregisteredAt: academies.nurseryDeregisteredAt })
          .from(academies)
          .where(eq(academies.id, approvedAcademyId))
          .limit(1);

        if (!academyRow?.nurseryDeregisteredAt) {
          throw new OnboardingRequestError("This academy is already active.");
        }

        const updated = await updateAcademyProfileFromOnboarding(approvedAcademyId, request.userId, {
          academyName: request.academyName!,
          district: request.district!,
          slug: request.slug!,
          sports: request.sports,
          fundingType: request.fundingType,
          brandColor: request.brandColor,
        });
        approvedAcademyId = updated.id;
      } else {
        const academy = await createAcademyProfile(request.userId, {
          academyName: request.academyName!,
          district: request.district!,
          slug: request.slug!,
          sports: request.sports,
          fundingType: request.fundingType,
          brandColor: request.brandColor,
        });
        approvedAcademyId = academy.id;
      }

      await ensureStateNurseryRegistered(approvedAcademyId, input.reviewerUserId);

      const [row] = await db
        .update(academyOnboardingRequests)
        .set({
          status: "approved",
          academyId: approvedAcademyId,
          reviewedByUserId: input.reviewerUserId,
          reviewedAt: new Date(),
          reviewNotes: input.reviewNotes?.trim() || null,
          requiredActions: [],
          updatedAt: new Date(),
        })
        .where(eq(academyOnboardingRequests.id, input.requestId))
        .returning();

      const [admin] = await db
        .select({ fullName: users.fullName, email: users.email })
        .from(users)
        .where(eq(users.id, request.userId))
        .limit(1);

      return mapDetail(row, admin ?? { fullName: "Academy admin", email: null });
    } catch (error) {
      if (error instanceof SlugTakenError || isUniqueViolation(error)) {
        throw new OnboardingRequestError("Branded link is no longer available. Request changes from the admin.");
      }
      throw error;
    }
  }

  if (input.action === "needs_action") {
    const actions = input.requiredActions ?? [];
    if (actions.length === 0) {
      throw new OnboardingRequestError("Select at least one required action.");
    }

    const [row] = await db
      .update(academyOnboardingRequests)
      .set({
        status: "needs_action",
        reviewedByUserId: input.reviewerUserId,
        reviewedAt: new Date(),
        reviewNotes: input.reviewNotes?.trim() || null,
        requiredActions: actions,
        updatedAt: new Date(),
      })
      .where(eq(academyOnboardingRequests.id, input.requestId))
      .returning();

    const [admin] = await db
      .select({ fullName: users.fullName, email: users.email })
      .from(users)
      .where(eq(users.id, request.userId))
      .limit(1);

    return mapDetail(row, admin ?? { fullName: "Academy admin", email: null });
  }

  const [row] = await db
    .update(academyOnboardingRequests)
    .set({
      status: "rejected",
      reviewedByUserId: input.reviewerUserId,
      reviewedAt: new Date(),
      reviewNotes: input.reviewNotes?.trim() || "Request rejected.",
      requiredActions: [],
      updatedAt: new Date(),
    })
    .where(eq(academyOnboardingRequests.id, input.requestId))
    .returning();

  const [admin] = await db
    .select({ fullName: users.fullName, email: users.email })
    .from(users)
    .where(eq(users.id, request.userId))
    .limit(1);

  return mapDetail(row, admin ?? { fullName: "Academy admin", email: null });
}

export async function userHasApprovedAcademy(userId: string): Promise<boolean> {
  const [membership] = await db
    .select({ academyId: academyMemberships.academyId })
    .from(academyMemberships)
    .where(eq(academyMemberships.userId, userId))
    .limit(1);

  return Boolean(membership);
}

export async function resetOnboardingForNurseryReregistration(
  adminUserId: string,
  academyId: string
): Promise<void> {
  const [row] = await db
    .select()
    .from(academyOnboardingRequests)
    .where(eq(academyOnboardingRequests.userId, adminUserId))
    .limit(1);

  if (!row) {
    throw new OnboardingRequestError("Onboarding request not found for academy admin.");
  }

  if (row.status !== "approved" || row.academyId !== academyId) {
    throw new OnboardingRequestError("Only approved nurseries can be reset for re-registration.");
  }

  await db
    .update(academyOnboardingRequests)
    .set({
      status: "draft",
      requestType: "resubmission",
      submittedAt: null,
      reviewedAt: null,
      reviewedByUserId: null,
      reviewNotes: null,
      requiredActions: [],
      updatedAt: new Date(),
    })
    .where(eq(academyOnboardingRequests.id, row.id));
}
