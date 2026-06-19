import { migrateLegacyAdminEmails, seedAllAcademyAdmins, writeAdminCredentialsCsv } from "@/db/seed/bulk/admin-credentials";
import { buildAllAcademySpecs } from "@/db/seed/bulk/distributions";
import { academies } from "@/db/schema";
import { loadEnv } from "@/lib/load-env";
import { db } from "@/lib/db/client";
import { eq, isNull } from "drizzle-orm";

loadEnv();

async function main() {
  const specs = buildAllAcademySpecs();
  const academyIds = new Map<string, string>();

  const rows = await db
    .select({ id: academies.id, slug: academies.slug })
    .from(academies)
    .where(isNull(academies.deletedAt));

  for (const row of rows) {
    academyIds.set(row.slug, row.id);
  }

  const migrated = await migrateLegacyAdminEmails();
  console.log(`Migrated ${migrated} legacy admin+ emails to admin- format.`);

  const credentialRows = await seedAllAcademyAdmins(specs, academyIds);
  const csvPath = await writeAdminCredentialsCsv(credentialRows);
  console.log(`Updated ${credentialRows.length} admin accounts → ${csvPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
