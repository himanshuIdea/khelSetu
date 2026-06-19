import { loadEnv } from "@/lib/load-env";
import { academies } from "@/db/schema";
import { db } from "@/lib/db/client";
import { and, isNull, notInArray } from "drizzle-orm";
import { seedIdentityUsers } from "@/db/seed/identity";
import { ensureStateNurseryRegistered, flagStateNursery } from "@/lib/repositories/state-nurseries";
import { seedAcademyDemoDepth, upsertGlobalSports } from "./bulk/academy-factory";
import {
  getStateAdminUserId,
  seedAllAcademyAdmins,
  writeAdminCredentialsCsv,
} from "./bulk/admin-credentials";
import { buildAllAcademySpecs, TOTAL_ACADEMIES } from "./bulk/distributions";
import { seedStateFunds } from "./state-funds";

loadEnv();

async function retireLegacyAcademies(validSlugs: string[]) {
  const retired = await db
    .update(academies)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(isNull(academies.deletedAt), notInArray(academies.slug, validSlugs)))
    .returning({ slug: academies.slug });

  if (retired.length > 0) {
    console.log(`  retired legacy academies: ${retired.map((row) => row.slug).join(", ")}`);
  }
}

async function main() {
  console.log(`Seeding Khel Setu bulk state data (${TOTAL_ACADEMIES} academies)...`);

  await seedIdentityUsers();
  const stateAdminUserId = await getStateAdminUserId();
  const sportIds = await upsertGlobalSports();
  const specs = buildAllAcademySpecs();
  await retireLegacyAcademies(specs.map((spec) => spec.slug));
  const academyIds = new Map<string, string>();

  let completed = 0;
  for (const spec of specs) {
    const result = await seedAcademyDemoDepth(spec, sportIds);
    academyIds.set(spec.slug, result.academyId);

    await ensureStateNurseryRegistered(
      result.academyId,
      stateAdminUserId,
      spec.verificationStatus
    );

    if (spec.verificationStatus === "flagged") {
      await flagStateNursery(
        result.academyId,
        {
          note: "Incomplete KYC documentation on file.",
          guidelines:
            "Upload valid Aadhaar and PAN documents via academy settings, then request a state review.",
        },
        stateAdminUserId
      );
    }

    completed += 1;
    if (completed % 10 === 0 || completed === specs.length) {
      console.log(`  academies seeded: ${completed}/${specs.length}`);
    }
  }

  const credentialRows = await seedAllAcademyAdmins(specs, academyIds);
  const csvPath = await writeAdminCredentialsCsv(credentialRows);

  await seedStateFunds(stateAdminUserId);

  const verified = specs.filter((s) => s.verificationStatus === "verified").length;
  const pending = specs.filter((s) => s.verificationStatus === "pending").length;
  const flagged = specs.filter((s) => s.verificationStatus === "flagged").length;

  console.log("Bulk seed complete.");
  console.log(`  academies: ${specs.length}`);
  console.log(`  nursery status — verified: ${verified}, pending: ${pending}, flagged: ${flagged}`);
  console.log(`  admin credentials: ${credentialRows.length} → ${csvPath}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
