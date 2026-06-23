import { cache } from "react";
import { and, eq, inArray, isNotNull, notInArray } from "drizzle-orm";
import { academyMemberships, academyOnboardingRequests, stateNurseryRegistrations, users } from "@/db/schema";
import { db } from "@/lib/db";
import { listStateOnboardingRequests } from "@/lib/repositories/academy-onboarding";
import { listStateNurseries } from "@/lib/repositories/state-nurseries";
import { type NurseryFlagResponseStatus } from "@/lib/state-nurseries";
import {
  onboardingInitials,
  onboardingStatusVariant,
  verificationQueueSortBand,
  verificationQueueSubPriority,
  type VerificationQueueItem,
  type VerificationQueueNurseryItem,
  type VerificationQueueOnboardingItem,
} from "@/lib/state-verification-queue";

export type {
  VerificationQueueItem,
  VerificationQueueNurseryItem,
  VerificationQueueOnboardingItem,
} from "@/lib/state-verification-queue";

export {
  verificationQueueStatusLabel,
  verificationQueueStatusVariant,
  verificationQueueSortBand,
  verificationQueueSubPriority,
  isPendingReviewQueueItem,
  isReviewRequestedQueueItem,
  needsStateReviewAction,
} from "@/lib/state-verification-queue";

async function getAdminNamesByAcademy(academyIds: string[]): Promise<Map<string, string>> {
  if (academyIds.length === 0) return new Map();

  const rows = await db
    .select({
      academyId: academyMemberships.academyId,
      fullName: users.fullName,
    })
    .from(academyMemberships)
    .innerJoin(users, eq(academyMemberships.userId, users.id))
    .where(
      and(inArray(academyMemberships.academyId, academyIds), eq(academyMemberships.role, "admin"))
    );

  return new Map(rows.map((row) => [row.academyId, row.fullName]));
}

export const listVerificationQueue = cache(async (): Promise<VerificationQueueItem[]> => {
  const [onboardingRequests, nurseries] = await Promise.all([
    listStateOnboardingRequests(),
    listStateNurseries(),
  ]);

  const academyIds = nurseries.map((n) => n.academyId);
  const [registrationRows, adminNames, linkedOnboardingRows] = await Promise.all([
    academyIds.length > 0
      ? db
          .select({
            academyId: stateNurseryRegistrations.academyId,
            flagResponseStatus: stateNurseryRegistrations.flagResponseStatus,
            createdAt: stateNurseryRegistrations.createdAt,
          })
          .from(stateNurseryRegistrations)
          .where(inArray(stateNurseryRegistrations.academyId, academyIds))
      : Promise.resolve([]),
    getAdminNamesByAcademy(academyIds),
    academyIds.length > 0
      ? db
          .select({
            id: academyOnboardingRequests.id,
            academyId: academyOnboardingRequests.academyId,
          })
          .from(academyOnboardingRequests)
          .where(
            and(
              isNotNull(academyOnboardingRequests.academyId),
              inArray(academyOnboardingRequests.academyId, academyIds),
              notInArray(academyOnboardingRequests.status, ["approved", "rejected", "draft"])
            )
          )
      : Promise.resolve([]),
  ]);

  const onboardingRequestByAcademy = new Map(
    linkedOnboardingRows
      .filter((row) => row.academyId)
      .map((row) => [row.academyId!, row.id])
  );

  const registrationByAcademy = new Map(
    registrationRows.map((row) => [
      row.academyId,
      {
        flagResponseStatus: row.flagResponseStatus as NurseryFlagResponseStatus,
        registeredAt: row.createdAt?.toISOString() ?? null,
      },
    ])
  );

  const onboardingItems: VerificationQueueOnboardingItem[] = onboardingRequests
    .filter((request) => request.status !== "approved")
    .map((request) => {
      const status = request.status;
      const submittedAt = request.submittedAt;
      const requestType = request.requestType;
      const item: VerificationQueueOnboardingItem = {
        kind: "onboarding" as const,
        id: request.id,
        name: request.academyName,
        initials: onboardingInitials(request.academyName),
        color: "#FF6B2C",
        adminFullName: request.adminFullName,
        district: request.district,
        queueTypeLabel: "Onboarding" as const,
        athleteCount: null,
        requestType,
        status,
        statusLabel: request.statusLabel,
        statusVariant: onboardingStatusVariant(status),
        submittedAt,
        sortPriority: 0,
        sortDate: submittedAt ? new Date(submittedAt).getTime() : 0,
      };
      return item;
    });

  const nurseryItems: VerificationQueueNurseryItem[] = nurseries.map((nursery) => {
    const registration = registrationByAcademy.get(nursery.academyId);
    const registeredAt = registration?.registeredAt ?? null;
    const flagResponseStatus = registration?.flagResponseStatus ?? "none";

    return {
      kind: "nursery" as const,
      academyId: nursery.academyId,
      name: nursery.name,
      initials: nursery.initials,
      color: nursery.color,
      adminFullName: adminNames.get(nursery.academyId) ?? "—",
      district: nursery.district,
      queueTypeLabel: "Registered" as const,
      athleteCount: nursery.athleteCount,
      verificationStatus: nursery.verificationStatus,
      statusLabel: nursery.statusLabel,
      statusVariant: nursery.status,
      flagResponseStatus,
      registeredAt,
      onboardingRequestId: onboardingRequestByAcademy.get(nursery.academyId) ?? null,
      sortPriority: 0,
      sortDate: registeredAt ? new Date(registeredAt).getTime() : 0,
    };
  });

  const items: VerificationQueueItem[] = [...onboardingItems, ...nurseryItems];

  items.sort((a, b) => {
    const bandA = verificationQueueSortBand(a);
    const bandB = verificationQueueSortBand(b);
    if (bandA !== bandB) return bandA - bandB;
    const subA = verificationQueueSubPriority(a);
    const subB = verificationQueueSubPriority(b);
    if (subA !== subB) return subA - subB;
    return b.sortDate - a.sortDate;
  });

  return items;
});
