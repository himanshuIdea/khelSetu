import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  academies,
  academyMemberships,
  academySports,
  sports,
  users,
} from "@/db/schema";
import { getInitials, type OnboardingPayload, type OnboardingResult } from "@/lib/onboarding";

const SPORT_COLORS: Record<string, string> = {
  Wrestling: "#FF6B2C",
  Boxing: "#12B886",
  Athletics: "#2F6BFF",
  Kabaddi: "#F5A623",
  Hockey: "#7C5CFC",
};

export async function isSlugAvailable(slug: string): Promise<boolean> {
  const [existing] = await db
    .select({ id: academies.id })
    .from(academies)
    .where(eq(academies.slug, slug))
    .limit(1);

  return !existing;
}

export async function createAcademyProfile(
  payload: OnboardingPayload
): Promise<OnboardingResult> {
  const available = await isSlugAvailable(payload.slug);
  if (!available) {
    throw new Error("This branded link is already taken. Try another.");
  }

  const fundingLabel = payload.fundingType === "private" ? "Private" : "Govt-aided";
  const locationLabel = `${payload.district.trim()} · ${fundingLabel}`;
  const initials = getInitials(payload.academyName);

  const [academy] = await db
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

  for (const sportName of payload.sports) {
    const color = SPORT_COLORS[sportName] ?? payload.brandColor;
    const [sport] = await db
      .insert(sports)
      .values({ name: sportName, color })
      .onConflictDoUpdate({ target: sports.name, set: { color } })
      .returning({ id: sports.id });

    await db
      .insert(academySports)
      .values({ academyId: academy.id, sportId: sport.id })
      .onConflictDoNothing({
        target: [academySports.academyId, academySports.sportId],
      });
  }

  if (payload.adminName) {
    const [user] = await db
      .insert(users)
      .values({
        fullName: payload.adminName,
        avatarInitials: getInitials(payload.adminName),
        email: payload.adminEmail ?? null,
        phone: payload.adminPhone ?? null,
        avatarColor: payload.brandColor,
      })
      .returning({ id: users.id });

    await db.insert(academyMemberships).values({
      userId: user.id,
      academyId: academy.id,
      role: "admin",
    });
  }

  return { id: academy.id, slug: academy.slug };
}
