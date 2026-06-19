/** First bulk-seeded academy slug — used for dev shortcuts and QA. */
export const SEED_ACADEMY_SLUG = "ambala-1";

/** Resolve the first seeded academy id from the database (slug is stable across re-seeds). */
export async function resolveSeedAcademyId(): Promise<string | null> {
  const { getAcademyBySlug } = await import("@/lib/repositories/academy");
  const academy = await getAcademyBySlug(SEED_ACADEMY_SLUG);
  return academy?.id ?? null;
}
