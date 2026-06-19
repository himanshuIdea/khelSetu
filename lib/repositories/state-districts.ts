import { cache } from "react";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { academies, coaches } from "@/db/schema";
import { HARYANA_DISTRICTS } from "@/lib/state-catalog";
import { formatCompactCount } from "@/lib/format";
import type { StateDistrictRow } from "@/lib/state-portal";
import {
  getAthleteCountByAcademy,
  getStateNurseryContext,
} from "./state-nursery-helpers";

export const listStateDistrictRollup = cache(async (): Promise<StateDistrictRow[]> => {
  const { academyIds, verificationByAcademy: verificationMap } = await getStateNurseryContext();

  if (academyIds.length === 0) {
    return HARYANA_DISTRICTS.map((name) => ({
      name,
      nurseries: 0,
      athletes: "0",
      athleteCount: 0,
      verifiedCount: 0,
      verificationRate: null,
      verified: "—",
      coaches: 0,
    }));
  }

  const academyRows = await db
    .select({
      id: academies.id,
      district: academies.district,
    })
    .from(academies)
    .where(and(inArray(academies.id, academyIds), isNull(academies.deletedAt)));

  const athleteCountByAcademy = await getAthleteCountByAcademy(academyIds);

  const coachRows = await db
    .select({
      district: academies.district,
      count: sql<number>`count(*)`,
    })
    .from(coaches)
    .innerJoin(academies, eq(coaches.academyId, academies.id))
    .where(inArray(coaches.academyId, academyIds))
    .groupBy(academies.district);

  const coachByDistrict = new Map(coachRows.map((r) => [r.district, Number(r.count)]));

  const rollup = new Map<
    string,
    { nurseries: number; athletes: number; verified: number }
  >();

  for (const district of HARYANA_DISTRICTS) {
    rollup.set(district, { nurseries: 0, athletes: 0, verified: 0 });
  }

  for (const academy of academyRows) {
    const entry = rollup.get(academy.district);
    if (!entry) continue;
    entry.nurseries += 1;
    entry.athletes += athleteCountByAcademy.get(academy.id) ?? 0;
    if (verificationMap.get(academy.id) === "verified") {
      entry.verified += 1;
    }
  }

  return HARYANA_DISTRICTS.map((name) => {
    const data = rollup.get(name) ?? { nurseries: 0, athletes: 0, verified: 0 };
    const verificationRate =
      data.nurseries > 0 ? Math.round((data.verified / data.nurseries) * 100) : null;

    return {
      name,
      nurseries: data.nurseries,
      athletes: data.athletes > 0 ? formatCompactCount(data.athletes) : "0",
      athleteCount: data.athletes,
      verifiedCount: data.verified,
      verificationRate,
      verified:
        data.nurseries > 0
          ? `${data.verified}/${data.nurseries} (${verificationRate}%)`
          : "—",
      coaches: coachByDistrict.get(name) ?? 0,
    };
  });
});
