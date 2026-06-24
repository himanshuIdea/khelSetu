import { loadEnv } from "@/lib/load-env";

loadEnv();

async function time(label: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    console.log(`${label}: ${Date.now() - start}ms OK`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`${label}: ${Date.now() - start}ms FAIL ${message}`);
  }
}

async function main() {
  const totalStart = Date.now();

  await time("users lookup", async () => {
    const { db } = await import("@/lib/db");
    const { users } = await import("@/db/schema");
    await db.select({ fullName: users.fullName }).from(users).limit(1);
  });

  await time("fetchNurseryVerificationEntries", async () => {
    const { db } = await import("@/lib/db");
    const { stateNurseryRegistrations, academyOnboardingRequests } = await import("@/db/schema");
    const { and, eq, isNotNull } = await import("drizzle-orm");
    await Promise.all([
      db
        .select({
          academyId: stateNurseryRegistrations.academyId,
          verificationStatus: stateNurseryRegistrations.verificationStatus,
        })
        .from(stateNurseryRegistrations),
      db
        .select({ academyId: academyOnboardingRequests.academyId })
        .from(academyOnboardingRequests)
        .where(
          and(
            eq(academyOnboardingRequests.status, "approved"),
            isNotNull(academyOnboardingRequests.academyId)
          )
        ),
    ]);
  });

  await time("cacheStateNurseryVerification (in-memory TTL)", async () => {
    const { cacheStateNurseryVerification } = await import("@/lib/repositories/state-portal-cache");
    const { db } = await import("@/lib/db");
    const { stateNurseryRegistrations } = await import("@/db/schema");
    await cacheStateNurseryVerification(async () => {
      return db
        .select({
          academyId: stateNurseryRegistrations.academyId,
          verificationStatus: stateNurseryRegistrations.verificationStatus,
        })
        .from(stateNurseryRegistrations);
    });
  });

  await time("listStateNurseries", async () => {
    const { listStateNurseries } = await import("@/lib/repositories/state-nurseries");
    const rows = await listStateNurseries();
    console.log(`  nurseries count: ${rows.length}`);
  });

  await time("getStateScoutingDashboard", async () => {
    const { getStateScoutingDashboard } = await import("@/lib/repositories/state-scouting");
    await getStateScoutingDashboard();
  });

  await time("listStateAthletesPage", async () => {
    const { listStateAthletesPage, DEFAULT_ATHLETE_PAGE_SIZE } = await import(
      "@/lib/repositories/state-athletes"
    );
    await listStateAthletesPage({
      filters: { minRating: 7 },
      offset: 0,
      limit: DEFAULT_ATHLETE_PAGE_SIZE,
    });
  });

  await time("getStateOverview", async () => {
    const { getStateOverview } = await import("@/lib/repositories/state-aggregates");
    await getStateOverview();
  });

  console.log(`TOTAL: ${Date.now() - totalStart}ms`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
