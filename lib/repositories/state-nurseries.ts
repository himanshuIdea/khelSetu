import { cache } from "react";
import { and, eq, ilike, inArray, isNotNull, isNull, notInArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  academies,
  academyMemberships,
  academyOnboardingRequests,
  players,
  stateNurseryRegistrations,
  users,
} from "@/db/schema";
import {
  buildNurseryDetailLine,
  nurseryStatusToPill,
  type AcademyNurseryFlag,
  type NurseryFlagResponseStatus,
  type NurseryVerificationStatus,
  type StateNurseryDetail,
  type StateNurseryFilters,
  type StateNurseryListItem,
  type StateNurserySearchResult,
} from "@/lib/state-nurseries";
import { formatDate } from "@/lib/format";
import {
  getAthleteCountByAcademy,
  getListedNurseryAcademyIds,
  getPrimarySportByAcademy,
  getSportsByAcademy,
  getStateNurseryContext,
} from "./state-nursery-helpers";
import { revalidateStateNurseryContextCache } from "./state-portal-cache";
import { resetOnboardingForNurseryReregistration } from "@/lib/repositories/academy-onboarding";

function applyListFilters(
  items: StateNurseryListItem[],
  filters?: StateNurseryFilters
): StateNurseryListItem[] {
  if (!filters) return items;

  return items.filter((item) => {
    if (filters.district && filters.district !== "all" && item.district !== filters.district) {
      return false;
    }
    if (filters.sport && filters.sport !== "all" && item.sportLabel !== filters.sport) {
      return false;
    }
    if (
      filters.status &&
      filters.status !== "all" &&
      item.verificationStatus !== filters.status
    ) {
      return false;
    }
    return true;
  });
}

export const listStateNurseries = cache(async (
  filters?: StateNurseryFilters
): Promise<StateNurseryListItem[]> => {
  const { verificationByAcademy, academyIds } = await getStateNurseryContext();
  if (academyIds.length === 0) return [];

  const rows = await db
    .select({
      academyId: academies.id,
      name: academies.name,
      initials: academies.initials,
      color: academies.brandColor,
      district: academies.district,
    })
    .from(academies)
    .where(and(inArray(academies.id, academyIds), isNull(academies.deletedAt)))
    .orderBy(academies.name);

  const listedAcademyIds = rows.map((row) => row.academyId);
  const [sportByAcademy, athleteCountByAcademy] = await Promise.all([
    getPrimarySportByAcademy(listedAcademyIds),
    getAthleteCountByAcademy(listedAcademyIds),
  ]);

  const items: StateNurseryListItem[] = rows.map((row) => {
    const verificationStatus = verificationByAcademy.get(row.academyId) ?? "verified";
    const sportLabel = sportByAcademy.get(row.academyId) ?? "Multi-sport";
    const pill = nurseryStatusToPill(verificationStatus);
    const detail = buildNurseryDetailLine(row.district, sportLabel);

    return {
      academyId: row.academyId,
      name: row.name,
      initials: row.initials,
      color: row.color,
      district: row.district,
      sportLabel,
      detail,
      athleteCount: athleteCountByAcademy.get(row.academyId) ?? 0,
      status: pill.variant,
      statusLabel: pill.label,
      verificationStatus,
    };
  });

  return applyListFilters(items, filters);
});

export async function listStateNurseryFilterOptions() {
  const nurseries = await listStateNurseries();
  const districts = [...new Set(nurseries.map((n) => n.district))].sort();
  const sports = [...new Set(nurseries.map((n) => n.sportLabel))].sort();

  return { districts, sports };
}

export async function searchUnregisteredAcademies(
  query: string
): Promise<StateNurserySearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const registeredIds = await getListedNurseryAcademyIds();

  const rows = await db
    .select({
      academyId: academies.id,
      name: academies.name,
      initials: academies.initials,
      color: academies.brandColor,
      district: academies.district,
    })
    .from(academies)
    .where(
      and(
        ilike(academies.name, `%${trimmed}%`),
        registeredIds.length > 0 ? notInArray(academies.id, registeredIds) : undefined
      )
    )
    .orderBy(academies.name)
    .limit(10);

  const sportByAcademy = await getPrimarySportByAcademy(rows.map((row) => row.academyId));

  return rows.map((row) => {
    const sportLabel = sportByAcademy.get(row.academyId) ?? "Multi-sport";
    return {
      academyId: row.academyId,
      name: row.name,
      initials: row.initials,
      color: row.color,
      district: row.district,
      sportLabel,
      detail: buildNurseryDetailLine(row.district, sportLabel),
    };
  });
}

export async function getStateNurseryDetail(
  academyId: string
): Promise<StateNurseryDetail | null> {
  const { verificationByAcademy } = await getStateNurseryContext();
  const verificationStatus = verificationByAcademy.get(academyId);
  if (!verificationStatus) return null;

  const [academy] = await db
    .select({
      name: academies.name,
      initials: academies.initials,
      color: academies.brandColor,
      district: academies.district,
      locationLabel: academies.locationLabel,
    })
    .from(academies)
    .where(and(eq(academies.id, academyId), isNull(academies.deletedAt)))
    .limit(1);

  if (!academy) return null;

  const [registration, onboardingReview] = await Promise.all([
    db
      .select({
        registeredAt: stateNurseryRegistrations.createdAt,
        flagNote: stateNurseryRegistrations.flagNote,
        flagGuidelines: stateNurseryRegistrations.flagGuidelines,
        flaggedAt: stateNurseryRegistrations.flaggedAt,
        flagResponseStatus: stateNurseryRegistrations.flagResponseStatus,
        flagResponseNote: stateNurseryRegistrations.flagResponseNote,
        flagResponseAt: stateNurseryRegistrations.flagResponseAt,
      })
      .from(stateNurseryRegistrations)
      .where(eq(stateNurseryRegistrations.academyId, academyId))
      .limit(1),
    db
      .select({ reviewedAt: academyOnboardingRequests.reviewedAt })
      .from(academyOnboardingRequests)
      .where(
        and(
          eq(academyOnboardingRequests.academyId, academyId),
          eq(academyOnboardingRequests.status, "approved")
        )
      )
      .limit(1),
  ]);

  const registeredAt =
    registration[0]?.registeredAt ?? onboardingReview[0]?.reviewedAt ?? null;
  const reg = registration[0];

  const [sportsList, athleteCounts, adminRow] = await Promise.all([
    getSportsByAcademy(academyId),
    getAthleteCountByAcademy([academyId]),
    db
      .select({
        fullName: users.fullName,
        email: users.email,
        phone: users.phone,
        avatarInitials: users.avatarInitials,
      })
      .from(academyMemberships)
      .innerJoin(users, eq(academyMemberships.userId, users.id))
      .where(
        and(eq(academyMemberships.academyId, academyId), eq(academyMemberships.role, "admin"))
      )
      .limit(1),
  ]);

  const sportLabel = sportsList[0] ?? "Multi-sport";
  const pill = nurseryStatusToPill(verificationStatus);
  const admin = adminRow[0];

  return {
    academyId,
    name: academy.name,
    initials: academy.initials,
    color: academy.color,
    district: academy.district,
    locationLabel: academy.locationLabel,
    sports: sportsList,
    sportLabel,
    athleteCount: athleteCounts.get(academyId) ?? 0,
    verificationStatus,
    status: pill.variant,
    statusLabel: pill.label,
    registeredAt: registeredAt ? formatDate(registeredAt) : "",
    admin: admin
      ? {
          fullName: admin.fullName,
          email: admin.email,
          phone: admin.phone,
          avatarInitials: admin.avatarInitials,
        }
      : null,
    flagNote: reg?.flagNote ?? null,
    flagGuidelines: reg?.flagGuidelines ?? null,
    flaggedAt: reg?.flaggedAt?.toISOString() ?? null,
    flagResponseStatus: (reg?.flagResponseStatus ?? "none") as NurseryFlagResponseStatus,
    flagResponseNote: reg?.flagResponseNote ?? null,
    flagResponseAt: reg?.flagResponseAt?.toISOString() ?? null,
  };
}

/** Preview academy before registration (not yet in state registry). */
export async function getUnregisteredAcademyPreview(
  academyId: string
): Promise<StateNurseryDetail | null> {
  const registeredIds = await getListedNurseryAcademyIds();
  if (registeredIds.includes(academyId)) {
    return null;
  }

  const [academy] = await db
    .select({
      name: academies.name,
      initials: academies.initials,
      color: academies.brandColor,
      district: academies.district,
      locationLabel: academies.locationLabel,
    })
    .from(academies)
    .where(eq(academies.id, academyId))
    .limit(1);

  if (!academy) return null;

  const [sportsList, athleteCounts, adminRow] = await Promise.all([
    getSportsByAcademy(academyId),
    getAthleteCountByAcademy([academyId]),
    db
      .select({
        fullName: users.fullName,
        email: users.email,
        phone: users.phone,
        avatarInitials: users.avatarInitials,
      })
      .from(academyMemberships)
      .innerJoin(users, eq(academyMemberships.userId, users.id))
      .where(eq(academyMemberships.academyId, academyId))
      .limit(1),
  ]);

  const sportLabel = sportsList[0] ?? "Multi-sport";
  const admin = adminRow[0];

  return {
    academyId,
    name: academy.name,
    initials: academy.initials,
    color: academy.color,
    district: academy.district,
    locationLabel: academy.locationLabel,
    sports: sportsList,
    sportLabel,
    athleteCount: athleteCounts.get(academyId) ?? 0,
    verificationStatus: "verified",
    status: "green",
    statusLabel: "Verified",
    registeredAt: "",
    admin: admin
      ? {
          fullName: admin.fullName,
          email: admin.email,
          phone: admin.phone,
          avatarInitials: admin.avatarInitials,
        }
      : null,
    flagNote: null,
    flagGuidelines: null,
    flaggedAt: null,
    flagResponseStatus: "none",
    flagResponseNote: null,
    flagResponseAt: null,
  };
}

export async function ensureStateNurseryRegistered(
  academyId: string,
  registeredByUserId: string,
  verificationStatus: NurseryVerificationStatus = "verified"
) {
  const [existing] = await db
    .select({ id: stateNurseryRegistrations.id, verificationStatus: stateNurseryRegistrations.verificationStatus })
    .from(stateNurseryRegistrations)
    .where(eq(stateNurseryRegistrations.academyId, academyId))
    .limit(1);

  if (existing) {
    if (existing.verificationStatus !== verificationStatus) {
      await db
        .update(stateNurseryRegistrations)
        .set({ verificationStatus, updatedAt: new Date() })
        .where(eq(stateNurseryRegistrations.id, existing.id));
      revalidateStateNurseryContextCache();
    }
    return;
  }

  await db.insert(stateNurseryRegistrations).values({
    academyId,
    registeredByUserId,
    verificationStatus,
  });
  revalidateStateNurseryContextCache();
}

export async function registerStateNursery(academyId: string, registeredByUserId: string) {
  const [academy] = await db
    .select({ id: academies.id })
    .from(academies)
    .where(eq(academies.id, academyId))
    .limit(1);

  if (!academy) {
    throw new Error("Academy not found.");
  }

  const [existing] = await db
    .select({ id: stateNurseryRegistrations.id })
    .from(stateNurseryRegistrations)
    .where(eq(stateNurseryRegistrations.academyId, academyId))
    .limit(1);

  if (existing) {
    throw new Error("This academy is already registered as a state nursery.");
  }

  await db.insert(stateNurseryRegistrations).values({
    academyId,
    registeredByUserId,
    verificationStatus: "verified",
  });
  revalidateStateNurseryContextCache();
}

export async function isAcademyNurseryDeregistered(academyId: string): Promise<boolean> {
  const [row] = await db
    .select({ nurseryDeregisteredAt: academies.nurseryDeregisteredAt })
    .from(academies)
    .where(eq(academies.id, academyId))
    .limit(1);

  return Boolean(row?.nurseryDeregisteredAt);
}

export async function getAcademyDeregistrationState(academyId: string) {
  const [row] = await db
    .select({ nurseryDeregisteredAt: academies.nurseryDeregisteredAt })
    .from(academies)
    .where(eq(academies.id, academyId))
    .limit(1);

  if (!row?.nurseryDeregisteredAt) return null;

  return {
    academyId,
    deregisteredAt: row.nurseryDeregisteredAt.toISOString(),
  };
}

export const ACADEMY_READONLY_MESSAGE =
  "Academy is read-only until nursery re-registration is approved.";

export async function deregisterStateNursery(academyId: string, _deregisteredByUserId: string) {
  const [adminRow] = await db
    .select({ userId: academyMemberships.userId })
    .from(academyMemberships)
    .where(and(eq(academyMemberships.academyId, academyId), eq(academyMemberships.role, "admin")))
    .limit(1);

  const [onboardingRow] = adminRow
    ? await db
        .select({
          id: academyOnboardingRequests.id,
          status: academyOnboardingRequests.status,
          academyId: academyOnboardingRequests.academyId,
        })
        .from(academyOnboardingRequests)
        .where(eq(academyOnboardingRequests.userId, adminRow.userId))
        .limit(1)
    : [];

  const isVerifiedNurseryReset =
    onboardingRow?.status === "approved" && onboardingRow.academyId === academyId;

  await db.transaction(async (tx) => {
    const deleted = await tx
      .delete(stateNurseryRegistrations)
      .where(eq(stateNurseryRegistrations.academyId, academyId))
      .returning({ id: stateNurseryRegistrations.id });

    if (deleted.length === 0) {
      throw new Error("Nursery registration not found.");
    }

    if (isVerifiedNurseryReset) {
      await tx
        .update(academies)
        .set({ nurseryDeregisteredAt: new Date(), updatedAt: new Date() })
        .where(eq(academies.id, academyId));
    }
  });

  if (isVerifiedNurseryReset && adminRow) {
    await resetOnboardingForNurseryReregistration(adminRow.userId, academyId);
  }
  revalidateStateNurseryContextCache();
}

export async function approveStateNursery(
  academyId: string,
  _reviewerUserId: string
): Promise<StateNurseryDetail> {
  const detail = await getStateNurseryDetail(academyId);
  if (!detail) {
    throw new Error("Nursery not found.");
  }

  if (detail.verificationStatus !== "pending") {
    throw new Error("Only pending nurseries can be approved.");
  }

  const [existing] = await db
    .select({ id: stateNurseryRegistrations.id })
    .from(stateNurseryRegistrations)
    .where(eq(stateNurseryRegistrations.academyId, academyId))
    .limit(1);

  if (!existing) {
    throw new Error("Nursery registration not found.");
  }

  const now = new Date();
  await db
    .update(stateNurseryRegistrations)
    .set({
      verificationStatus: "verified",
      updatedAt: now,
    })
    .where(eq(stateNurseryRegistrations.id, existing.id));

  const updated = await getStateNurseryDetail(academyId);
  if (!updated) {
    throw new Error("Could not load updated nursery.");
  }
  revalidateStateNurseryContextCache();
  return updated;
}

export async function flagStateNursery(
  academyId: string,
  input: { note: string; guidelines: string },
  reviewerUserId: string
): Promise<StateNurseryDetail> {
  const note = input.note.trim();
  const guidelines = input.guidelines.trim();
  if (!note || !guidelines) {
    throw new Error("Flag note and guidelines are required.");
  }

  const detail = await getStateNurseryDetail(academyId);
  if (!detail) {
    throw new Error("Nursery not found.");
  }

  const now = new Date();
  const [existing] = await db
    .select({ id: stateNurseryRegistrations.id })
    .from(stateNurseryRegistrations)
    .where(eq(stateNurseryRegistrations.academyId, academyId))
    .limit(1);

  if (existing) {
    await db
      .update(stateNurseryRegistrations)
      .set({
        verificationStatus: "flagged",
        flagNote: note,
        flagGuidelines: guidelines,
        flaggedAt: now,
        flaggedByUserId: reviewerUserId,
        flagResponseStatus: "none",
        flagResponseNote: null,
        flagResponseAt: null,
        updatedAt: now,
      })
      .where(eq(stateNurseryRegistrations.id, existing.id));
  } else {
    await db.insert(stateNurseryRegistrations).values({
      academyId,
      registeredByUserId: reviewerUserId,
      verificationStatus: "flagged",
      flagNote: note,
      flagGuidelines: guidelines,
      flaggedAt: now,
      flaggedByUserId: reviewerUserId,
      flagResponseStatus: "none",
    });
  }

  const updated = await getStateNurseryDetail(academyId);
  if (!updated) {
    throw new Error("Could not load updated nursery.");
  }
  revalidateStateNurseryContextCache();
  return updated;
}

export async function clearNurseryFlag(
  academyId: string,
  _reviewerUserId: string
): Promise<StateNurseryDetail> {
  const [existing] = await db
    .select({ id: stateNurseryRegistrations.id })
    .from(stateNurseryRegistrations)
    .where(eq(stateNurseryRegistrations.academyId, academyId))
    .limit(1);

  if (!existing) {
    throw new Error("Nursery registration not found.");
  }

  const now = new Date();
  await db
    .update(stateNurseryRegistrations)
    .set({
      verificationStatus: "verified",
      flagNote: null,
      flagGuidelines: null,
      flaggedAt: null,
      flaggedByUserId: null,
      flagResponseStatus: "none",
      flagResponseNote: null,
      flagResponseAt: null,
      updatedAt: now,
    })
    .where(eq(stateNurseryRegistrations.id, existing.id));

  const updated = await getStateNurseryDetail(academyId);
  if (!updated) {
    throw new Error("Could not load updated nursery.");
  }
  revalidateStateNurseryContextCache();
  return updated;
}

export async function getAcademyNurseryFlag(academyId: string): Promise<AcademyNurseryFlag | null> {
  const [row] = await db
    .select({
      academyId: stateNurseryRegistrations.academyId,
      verificationStatus: stateNurseryRegistrations.verificationStatus,
      flagNote: stateNurseryRegistrations.flagNote,
      flagGuidelines: stateNurseryRegistrations.flagGuidelines,
      flaggedAt: stateNurseryRegistrations.flaggedAt,
      flagResponseStatus: stateNurseryRegistrations.flagResponseStatus,
      flagResponseNote: stateNurseryRegistrations.flagResponseNote,
      flagResponseAt: stateNurseryRegistrations.flagResponseAt,
    })
    .from(stateNurseryRegistrations)
    .where(eq(stateNurseryRegistrations.academyId, academyId))
    .limit(1);

  if (!row || row.verificationStatus !== "flagged" || !row.flagNote || !row.flagGuidelines) {
    return null;
  }

  return {
    academyId: row.academyId,
    flagNote: row.flagNote,
    flagGuidelines: row.flagGuidelines,
    flaggedAt: row.flaggedAt?.toISOString() ?? new Date().toISOString(),
    flagResponseStatus: row.flagResponseStatus as NurseryFlagResponseStatus,
    flagResponseNote: row.flagResponseNote,
    flagResponseAt: row.flagResponseAt?.toISOString() ?? null,
  };
}

export async function respondToNurseryFlag(
  academyId: string,
  input: { action: "addressed" | "request_review"; note?: string }
): Promise<AcademyNurseryFlag> {
  const [row] = await db
    .select({ id: stateNurseryRegistrations.id })
    .from(stateNurseryRegistrations)
    .where(
      and(
        eq(stateNurseryRegistrations.academyId, academyId),
        eq(stateNurseryRegistrations.verificationStatus, "flagged")
      )
    )
    .limit(1);

  if (!row) {
    throw new Error("No active flag found for this nursery.");
  }

  const now = new Date();
  const responseStatus: NurseryFlagResponseStatus =
    input.action === "addressed" ? "addressed" : "review_requested";

  await db
    .update(stateNurseryRegistrations)
    .set({
      flagResponseStatus: responseStatus,
      flagResponseNote: input.note?.trim() || null,
      flagResponseAt: now,
      updatedAt: now,
    })
    .where(eq(stateNurseryRegistrations.id, row.id));

  const flag = await getAcademyNurseryFlag(academyId);
  if (!flag) {
    throw new Error("Could not load flag after response.");
  }
  return flag;
}
