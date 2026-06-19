import { and, eq, isNull } from "drizzle-orm";
import { academies } from "@/db/schema";
import { syncAcademyPlayerRoster, upsertGlobalSports } from "@/db/seed/bulk/academy-factory";
import { buildAllAcademySpecs, expectedTotalPlayers } from "@/db/seed/bulk/distributions";
import { loadEnv } from "@/lib/load-env";
import { db } from "@/lib/db/client";

loadEnv();

async function main() {
  const specs = buildAllAcademySpecs();
  const sportIds = await upsertGlobalSports();
  let synced = 0;
  let players = 0;

  for (const spec of specs) {
    const [academy] = await db
      .select({ id: academies.id })
      .from(academies)
      .where(and(eq(academies.slug, spec.slug), isNull(academies.deletedAt)))
      .limit(1);

    if (!academy) {
      console.warn(`  skip missing academy: ${spec.slug}`);
      continue;
    }

    const count = await syncAcademyPlayerRoster(spec, academy.id, sportIds);
    synced += 1;
    players += count;

    if (synced % 10 === 0 || synced === specs.length) {
      console.log(`  rosters synced: ${synced}/${specs.length}`);
    }
  }

  console.log(`Player roster refresh complete.`);
  console.log(`  academies: ${synced}`);
  console.log(`  active roster rows: ${players} (expected ~${expectedTotalPlayers()})`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
