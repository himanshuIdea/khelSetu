import { and, eq, isNull } from "drizzle-orm";
import { academies } from "@/db/schema";
import { syncAcademyCoachRoster, upsertGlobalSports } from "@/db/seed/bulk/academy-factory";
import {
  academyIngestOrder,
  buildAcademySpec,
  coachCountForAcademy,
  expectedTotalCoaches,
} from "@/db/seed/bulk/distributions";
import { loadEnv } from "@/lib/load-env";
import { db } from "@/lib/db/client";

loadEnv();

function formatProgress(current: number, total: number): string {
  const pct = Math.round((current / total) * 100);
  const barLen = 24;
  const filled = Math.round((current / total) * barLen);
  const bar = "█".repeat(filled) + "░".repeat(barLen - filled);
  return `[${bar}] ${pct}% (${current}/${total})`;
}

async function main() {
  const allSpecs = academyIngestOrder().map((index) => buildAcademySpec(index));
  const sportIds = await upsertGlobalSports();

  let processed = 0;
  let skipped = 0;
  let coachesAdded = 0;
  const finalCounts: number[] = [];

  console.log("Coach roster refresh — varied counts per academy");
  console.log(`  academies in queue: ${allSpecs.length}`);
  console.log(`  expected total coaches: ~${expectedTotalCoaches()}`);
  console.log(`  ingest order: shuffled by academy index (not alphabetical)\n`);

  for (const spec of allSpecs) {
    const [academy] = await db
      .select({ id: academies.id, slug: academies.slug })
      .from(academies)
      .where(and(eq(academies.slug, spec.slug), isNull(academies.deletedAt)))
      .limit(1);

    if (!academy) {
      skipped += 1;
      console.log(`  ⊘ skip (missing): ${spec.slug}`);
      continue;
    }

    const target = coachCountForAcademy(spec.academyIndex);
    process.stdout.write(
      `  → ${spec.slug.padEnd(22)} target=${String(target).padStart(2)} … `
    );

    const result = await syncAcademyCoachRoster(spec, academy.id, sportIds);
    processed += 1;
    coachesAdded += result.added;
    finalCounts.push(result.total);

    const delta =
      result.added > 0 ? `+${result.added} new` : result.before >= target ? "no change" : "synced";
    console.log(`done (${result.before} → ${result.total}, ${delta})`);

    if (processed % 5 === 0 || processed + skipped === allSpecs.length) {
      console.log(`  ${formatProgress(processed + skipped, allSpecs.length)}\n`);
    }
  }

  const uniqueCounts = new Set(finalCounts).size;
  const minCount = finalCounts.length ? Math.min(...finalCounts) : 0;
  const maxCount = finalCounts.length ? Math.max(...finalCounts) : 0;

  console.log("Coach roster refresh complete.");
  console.log(`  academies processed: ${processed}`);
  console.log(`  academies skipped (missing): ${skipped}`);
  console.log(`  coaches added this run: ${coachesAdded}`);
  console.log(`  coach count range: ${minCount}–${maxCount} (${uniqueCounts} distinct counts)`);
  console.log(`  expected total (spec): ~${expectedTotalCoaches()}`);
}

main().catch((error) => {
  console.error("Coach refresh failed:", error);
  process.exit(1);
});
