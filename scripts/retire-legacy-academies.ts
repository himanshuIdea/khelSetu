import { and, isNull, notInArray } from "drizzle-orm";
import { academies } from "@/db/schema";
import { buildAllAcademySpecs } from "@/db/seed/bulk/distributions";
import { loadEnv } from "@/lib/load-env";
import { db } from "@/lib/db/client";

loadEnv();

async function main() {
  const validSlugs = buildAllAcademySpecs().map((spec) => spec.slug);
  const retired = await db
    .update(academies)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(isNull(academies.deletedAt), notInArray(academies.slug, validSlugs)))
    .returning({ slug: academies.slug });

  if (retired.length === 0) {
    console.log("No legacy academies to retire.");
    return;
  }

  console.log(`Retired ${retired.length} legacy academies:`);
  for (const row of retired) {
    console.log(`  - ${row.slug}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
