import { cache } from "react";
import { and, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  academyOnboardingRequests,
  academySports,
  players,
  sports,
  stateNurseryRegistrations,
} from "@/db/schema";
import type { NurseryVerificationStatus } from "@/lib/state-nurseries";

export const getPrimarySportByAcademy = cache(async (academyIds: string[]) => {
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
});

export async function getSportsByAcademy(academyId: string) {
  const rows = await db
    .select({ sportName: sports.name })
    .from(academySports)
    .innerJoin(sports, eq(academySports.sportId, sports.id))
    .where(eq(academySports.academyId, academyId))
    .orderBy(sports.name);

  return rows.map((row) => row.sportName);
}

export const getAthleteCountByAcademy = cache(async (academyIds: string[]) => {
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
});

export const getNurseryVerificationByAcademy = cache(async (): Promise<
  Map<string, NurseryVerificationStatus>
> => {
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
});

export const getListedNurseryAcademyIds = cache(async (): Promise<string[]> => {
  return [...(await getNurseryVerificationByAcademy()).keys()];
});

export const getListedNurseryAcademyIdSet = cache(async (): Promise<Set<string>> => {
  return new Set(await getListedNurseryAcademyIds());
});

export const getStateNurseryContext = cache(async () => {
  const verificationByAcademy = await getNurseryVerificationByAcademy();
  return {
    verificationByAcademy,
    academyIds: [...verificationByAcademy.keys()],
  };
});
