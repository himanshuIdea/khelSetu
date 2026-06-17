import { unstable_cache } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { academies, academyMemberships, users } from "@/db/schema";
import { isValidAcademyId } from "@/lib/academy-id";
import type { AcademyMeta } from "./types";

export async function getAcademyById(academyId: string) {
  if (!isValidAcademyId(academyId)) return null;

  const [academy] = await db
    .select()
    .from(academies)
    .where(eq(academies.id, academyId))
    .limit(1);

  return academy ?? null;
}

export async function getAcademyBySlug(slug: string) {
  const [academy] = await db
    .select()
    .from(academies)
    .where(eq(academies.slug, slug))
    .limit(1);

  return academy ?? null;
}

export async function getAcademyMeta(academyId: string): Promise<AcademyMeta | null> {
  return unstable_cache(
    async () => {
      const academy = await getAcademyById(academyId);
      if (!academy) return null;

      const [adminRow] = await db
        .select({
          fullName: users.fullName,
          avatarInitials: users.avatarInitials,
        })
        .from(academyMemberships)
        .innerJoin(users, eq(academyMemberships.userId, users.id))
        .where(eq(academyMemberships.academyId, academy.id))
        .limit(1);

      return {
        id: academy.id,
        slug: academy.slug,
        initials: academy.initials,
        name: academy.name,
        location: academy.locationLabel,
        adminInitials: adminRow?.avatarInitials ?? "AD",
        adminName: adminRow?.fullName ?? "Academy Admin",
        adminRole: "Academy Admin",
      };
    },
    ["academy-meta", academyId],
    { revalidate: 60 }
  )();
}
