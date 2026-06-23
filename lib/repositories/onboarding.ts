import { eq } from "drizzle-orm";
import { db, isUniqueViolation, SlugTakenError } from "@/lib/db";
import {
  academies,
  academyMemberships,
  academySports,
  sports,
  users,
} from "@/db/schema";
import { getInitials, type OnboardingPayload, type OnboardingResult } from "@/lib/onboarding";
import { ensureAcademyBatches } from "@/lib/repositories/batches";

const SPORT_COLORS: Record<string, string> = {
  Wrestling: "#FF6B2C",
  Boxing: "#12B886",
  Athletics: "#2F6BFF",
  Kabaddi: "#F5A623",
  Hockey: "#7C5CFC",
};

async function upsertAcademySports(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  academyId: string,
  sportNames: string[],
  brandColor: string
) {
  for (const sportName of sportNames) {
    const color = SPORT_COLORS[sportName] ?? brandColor;
    const [sport] = await tx
      .insert(sports)
      .values({ name: sportName, color })
      .onConflictDoUpdate({ target: sports.name, set: { color } })
      .returning({ id: sports.id });

    await tx
      .insert(academySports)
      .values({ academyId, sportId: sport.id })
      .onConflictDoNothing({
        target: [academySports.academyId, academySports.sportId],
      });
  }
}

export async function isSlugAvailable(slug: string, excludeAcademyId?: string): Promise<boolean> {
  const [existing] = await db
    .select({ id: academies.id })
    .from(academies)
    .where(eq(academies.slug, slug))
    .limit(1);

  if (!existing) return true;
  return excludeAcademyId != null && existing.id === excludeAcademyId;
}

export async function createAcademyProfile(
  userId: string,
  payload: OnboardingPayload
): Promise<OnboardingResult> {
  const fundingLabel = payload.fundingType === "private" ? "Private" : "Govt-aided";
  const locationLabel = `${payload.district.trim()} · ${fundingLabel}`;
  const initials = getInitials(payload.academyName);

  try {
    const result = await db.transaction(async (tx) => {
      const [academy] = await tx
        .insert(academies)
        .values({
          slug: payload.slug,
          name: payload.academyName.trim(),
          district: payload.district.trim(),
          state: "Haryana",
          fundingType: payload.fundingType,
          brandColor: payload.brandColor,
          initials,
          locationLabel,
        })
        .returning({ id: academies.id, slug: academies.slug });

      await upsertAcademySports(tx, academy.id, payload.sports, payload.brandColor);

      await tx.insert(academyMemberships).values({
        userId,
        academyId: academy.id,
        role: "admin",
      });

      await tx
        .update(users)
        .set({
          avatarColor: payload.brandColor,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      return { id: academy.id, slug: academy.slug };
    });

    await ensureAcademyBatches(result.id);
    return result;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new SlugTakenError();
    }
    throw error;
  }
}

export async function updateAcademyProfileFromOnboarding(
  academyId: string,
  userId: string,
  payload: OnboardingPayload
): Promise<OnboardingResult> {
  const fundingLabel = payload.fundingType === "private" ? "Private" : "Govt-aided";
  const locationLabel = `${payload.district.trim()} · ${fundingLabel}`;
  const initials = getInitials(payload.academyName);

  const slugTaken = !(await isSlugAvailable(payload.slug, academyId));
  if (slugTaken) {
    throw new SlugTakenError();
  }

  try {
    const result = await db.transaction(async (tx) => {
      const [academy] = await tx
        .update(academies)
        .set({
          slug: payload.slug,
          name: payload.academyName.trim(),
          district: payload.district.trim(),
          fundingType: payload.fundingType,
          brandColor: payload.brandColor,
          initials,
          locationLabel,
          nurseryDeregisteredAt: null,
          updatedAt: new Date(),
        })
        .where(eq(academies.id, academyId))
        .returning({ id: academies.id, slug: academies.slug });

      if (!academy) {
        throw new Error("Academy not found.");
      }

      await upsertAcademySports(tx, academy.id, payload.sports, payload.brandColor);

      await tx
        .update(users)
        .set({
          avatarColor: payload.brandColor,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      return { id: academy.id, slug: academy.slug };
    });

    await ensureAcademyBatches(result.id);
    return result;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new SlugTakenError();
    }
    throw error;
  }
}
