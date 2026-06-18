import { and, eq, ilike, inArray, isNotNull, isNull, notInArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  academies,
  academyMemberships,
  academyOnboardingRequests,
  academySports,
  players,
  sports,
  stateNurseryRegistrations,
  users,
} from "@/db/schema";
import {
  buildNurseryDetailLine,
  nurseryStatusToPill,
  type NurseryVerificationStatus,
  type StateNurseryDetail,
  type StateNurseryFilters,
  type StateNurseryListItem,
  type StateNurserySearchResult,
} from "@/lib/state-nurseries";
import { formatDate } from "@/lib/format";

async function getPrimarySportByAcademy(academyIds: string[]) {
  if (academyIds.length === 0) return new Map<string, string>();

  const rows = await db
    .select({
      academyId: academySports.academyId,
      sportName: sports.name,
    })
    .from(academySports)
    .innerJoin(sports, eq(academySports.sportId, sports.id))
    .where(inArray(academySports.academyId, academyIds))
    .orderBy(academySports.academyId, sports.name);

  const map = new Map<string, string>();
  for (const row of rows) {
    if (!map.has(row.academyId)) {
      map.set(row.academyId, row.sportName);
    }
  }
  return map;
}

async function getSportsByAcademy(academyId: string) {
  const rows = await db
    .select({ sportName: sports.name })
    .from(academySports)
    .innerJoin(sports, eq(academySports.sportId, sports.id))
    .where(eq(academySports.academyId, academyId))
    .orderBy(sports.name);

  return rows.map((row) => row.sportName);
}

async function getAthleteCountByAcademy(academyIds: string[]) {
  if (academyIds.length === 0) return new Map<string, number>();

  const rows = await db
    .select({
      academyId: players.academyId,
      count: sql<number>`count(*)`,
    })
    .from(players)
    .where(
      and(
        inArray(players.academyId, academyIds),
        inArray(players.status, ["active", "on_hold"])
      )
    )
    .groupBy(players.academyId);

  return new Map(rows.map((row) => [row.academyId, Number(row.count)]));
}

async function getNurseryVerificationByAcademy(): Promise<
  Map<string, NurseryVerificationStatus>
> {
  const registrationRows = await db
    .select({
      academyId: stateNurseryRegistrations.academyId,
      verificationStatus: stateNurseryRegistrations.verificationStatus,
    })
    .from(stateNurseryRegistrations);

  const map = new Map<string, NurseryVerificationStatus>(
    registrationRows.map((row) => [
      row.academyId,
      row.verificationStatus as NurseryVerificationStatus,
    ])
  );

  const approvedRows = await db
    .select({ academyId: academyOnboardingRequests.academyId })
    .from(academyOnboardingRequests)
    .where(
      and(
        eq(academyOnboardingRequests.status, "approved"),
        isNotNull(academyOnboardingRequests.academyId)
      )
    );

  for (const row of approvedRows) {
    if (row.academyId && !map.has(row.academyId)) {
      map.set(row.academyId, "verified");
    }
  }

  return map;
}

async function getListedNurseryAcademyIds(): Promise<string[]> {
  return [...(await getNurseryVerificationByAcademy()).keys()];
}

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

export async function listStateNurseries(
  filters?: StateNurseryFilters
): Promise<StateNurseryListItem[]> {
  const verificationByAcademy = await getNurseryVerificationByAcademy();
  const academyIds = [...verificationByAcademy.keys()];
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
}

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
  const verificationByAcademy = await getNurseryVerificationByAcademy();
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
      .select({ registeredAt: stateNurseryRegistrations.createdAt })
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
  };
}

export async function ensureStateNurseryRegistered(
  academyId: string,
  registeredByUserId: string,
  verificationStatus: NurseryVerificationStatus = "verified"
) {
  const [existing] = await db
    .select({ id: stateNurseryRegistrations.id })
    .from(stateNurseryRegistrations)
    .where(eq(stateNurseryRegistrations.academyId, academyId))
    .limit(1);

  if (existing) return;

  await db.insert(stateNurseryRegistrations).values({
    academyId,
    registeredByUserId,
    verificationStatus,
  });
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
}

export async function deregisterStateNursery(academyId: string) {
  const deleted = await db
    .delete(stateNurseryRegistrations)
    .where(eq(stateNurseryRegistrations.academyId, academyId))
    .returning({ id: stateNurseryRegistrations.id });

  if (deleted.length === 0) {
    throw new Error("Nursery registration not found.");
  }
}
