/** Deterministic IDs for local seed data — not used in production routing logic. */
export const SEED_ACADEMY_ID = "a1000000-0000-4000-8000-000000000001";
export const SEED_ACADEMY_SLUG = "dronacharya";

/** Resolve the seeded academy id from the database (slug is stable across re-seeds). */
export async function resolveSeedAcademyId(): Promise<string | null> {
  const { getAcademyBySlug } = await import("@/lib/repositories/academy");
  const academy = await getAcademyBySlug(SEED_ACADEMY_SLUG);
  return academy?.id ?? null;
}
