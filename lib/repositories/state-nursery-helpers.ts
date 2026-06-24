import { cache } from "react";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  academySports,
  players,
  sports,
} from "@/db/schema";
import type { NurseryVerificationStatus } from "@/lib/state-nurseries";
import { cacheStateNurseryVerification } from "./state-portal-cache";

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

async function fetchNurseryVerificationEntries(): Promise<
  [string, NurseryVerificationStatus][]
> {
  const rows = await db.execute<{
    academy_id: string;
    status: string;
  }>(sql`
    SELECT r.academy_id, r.verification_status::text AS status
    FROM platform.state_nursery_registrations r
    UNION ALL
    SELECT o.academy_id, 'verified' AS status
    FROM platform.academy_onboarding_requests o
    WHERE o.status = 'approved'
      AND o.academy_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM platform.state_nursery_registrations r2
        WHERE r2.academy_id = o.academy_id
      )
  `);

  return rows.map((row) => [row.academy_id, row.status as NurseryVerificationStatus]);
}

export const getNurseryVerificationByAcademy = cache(async (): Promise<
  Map<string, NurseryVerificationStatus>
> => {
  const entries = await cacheStateNurseryVerification(fetchNurseryVerificationEntries);
  return new Map(entries);
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
