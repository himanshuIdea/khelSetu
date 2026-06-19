/**
 * Audit bulk seed completeness — run: pnpm exec tsx scripts/audit-seed.ts
 */
import postgres from "postgres";
import { loadEnv } from "@/lib/load-env";
import { SEED_ACADEMY_SLUG } from "@/lib/seed-constants";
import {
  ACADEMIES_PER_DISTRICT,
  COACHES_PER_ACADEMY_MIN,
  COACHES_PER_ACADEMY_MAX,
  PLAYERS_PER_ACADEMY_MIN,
  PLAYERS_PER_ACADEMY_MAX,
  TOTAL_ACADEMIES,
} from "@/db/seed/bulk/constants";
import { expectedTotalCoaches, expectedTotalPlayers } from "@/db/seed/bulk/distributions";
import { HARYANA_DISTRICTS } from "@/lib/state-catalog";

loadEnv();

type CountRow = { count: string };

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL missing");
    process.exit(1);
  }

  const sql = postgres(url, { prepare: false, max: 1, connect_timeout: 15 });

  try {
    const report = {
      expected: {
        academies: TOTAL_ACADEMIES,
        districts: HARYANA_DISTRICTS.length,
        academiesPerDistrict: ACADEMIES_PER_DISTRICT,
        coachesPerAcademyRange: `${COACHES_PER_ACADEMY_MIN}-${COACHES_PER_ACADEMY_MAX}`,
        expectedTotalCoaches: expectedTotalCoaches(),
        playersPerAcademyRange: `${PLAYERS_PER_ACADEMY_MIN}-${PLAYERS_PER_ACADEMY_MAX}`,
        expectedTotalPlayers: expectedTotalPlayers(),
        sampleSlug: SEED_ACADEMY_SLUG,
      },
      actual: {} as Record<string, unknown>,
      perDistrict: [] as { district: string; count: number }[],
      issues: [] as string[],
      status: "unknown",
    };

    const scalar = async (query: postgres.PendingQuery<CountRow[]>) => {
      const [row] = await query;
      return Number(row?.count ?? 0);
    };

    report.actual.academies = await scalar(
      sql`SELECT COUNT(*)::text AS count FROM academy.academies WHERE deleted_at IS NULL`
    );
    report.actual.nurseryRegistrations = await scalar(
      sql`SELECT COUNT(*)::text AS count FROM platform.state_nursery_registrations`
    );
    report.actual.users = await scalar(sql`SELECT COUNT(*)::text AS count FROM identity.users`);
    report.actual.academyMemberships = await scalar(
      sql`SELECT COUNT(*)::text AS count FROM identity.academy_memberships`
    );
    report.actual.sports = await scalar(sql`SELECT COUNT(*)::text AS count FROM academy.sports`);
    report.actual.batches = await scalar(sql`SELECT COUNT(*)::text AS count FROM academy.batches`);
    report.actual.coaches = await scalar(
      sql`SELECT COUNT(*)::text AS count FROM people.coaches`
    );
    report.actual.players = await scalar(
      sql`SELECT COUNT(*)::text AS count FROM people.players`
    );
    report.actual.teams = await scalar(
      sql`SELECT COUNT(*)::text AS count FROM competitions.teams`
    );
    report.actual.tournaments = await scalar(
      sql`SELECT COUNT(*)::text AS count FROM competitions.tournaments`
    );
    report.actual.inventoryItems = await scalar(
      sql`SELECT COUNT(*)::text AS count FROM inventory.inventory_items`
    );
    report.actual.staff = await scalar(
      sql`SELECT COUNT(*)::text AS count FROM people.staff`
    );
    report.actual.trainingSessions = await scalar(
      sql`SELECT COUNT(*)::text AS count FROM operations.training_sessions`
    );
    report.actual.drillPosts = await scalar(
      sql`SELECT COUNT(*)::text AS count FROM training.coach_drill_posts`
    );

    const nurseryStatus = await sql<{ status: string; count: string }[]>`
      SELECT verification_status AS status, COUNT(*)::text AS count
      FROM platform.state_nursery_registrations
      GROUP BY verification_status
      ORDER BY status
    `;
    report.actual.nurseryByStatus = Object.fromEntries(
      nurseryStatus.map((r) => [r.status, Number(r.count)])
    );

    const perDistrict = await sql<{ district: string; count: string }[]>`
      SELECT district, COUNT(*)::text AS count
      FROM academy.academies
      WHERE deleted_at IS NULL
      GROUP BY district
      ORDER BY district
    `;
    report.perDistrict = perDistrict.map((r) => ({
      district: r.district,
      count: Number(r.count),
    }));

    const districtsIncomplete = (report.perDistrict as { district: string; count: number }[]).filter(
      (d) => d.count < ACADEMIES_PER_DISTRICT
    );
    const districtsMissing = HARYANA_DISTRICTS.filter(
      (d) => !(report.perDistrict as { district: string }[]).some((r) => r.district === d)
    );

    const [sample] = await sql<{ id: string; slug: string; name: string }[]>`
      SELECT id, slug, name FROM academy.academies WHERE slug = ${SEED_ACADEMY_SLUG} LIMIT 1
    `;
    report.actual.sampleAcademy = sample ?? null;

    if (sample) {
      const academyId = sample.id;
      const [depth] = await sql<{
        coaches: string;
        players: string;
        batches: string;
        teams: string;
      }[]>`
        SELECT
          (SELECT COUNT(*)::text FROM people.coaches WHERE academy_id = ${academyId}) AS coaches,
          (SELECT COUNT(*)::text FROM people.players WHERE academy_id = ${academyId}) AS players,
          (SELECT COUNT(*)::text FROM academy.batches WHERE academy_id = ${academyId}) AS batches,
          (SELECT COUNT(*)::text FROM competitions.teams WHERE academy_id = ${academyId}) AS teams
      `;
      report.actual.sampleDepth = {
        coaches: Number(depth?.coaches ?? 0),
        players: Number(depth?.players ?? 0),
        batches: Number(depth?.batches ?? 0),
        teams: Number(depth?.teams ?? 0),
        expectedCoachesRange: `${COACHES_PER_ACADEMY_MIN}-${COACHES_PER_ACADEMY_MAX}`,
        expectedPlayersRange: `${PLAYERS_PER_ACADEMY_MIN}-${PLAYERS_PER_ACADEMY_MAX}`,
      };
    }

    const [stateAdmin] = await sql<{ email: string; platform_role: string | null }[]>`
      SELECT email, platform_role FROM identity.users
      WHERE platform_role = 'state_admin' LIMIT 1
    `;
    report.actual.stateAdmin = stateAdmin
      ? { present: true, platformRole: stateAdmin.platform_role }
      : { present: false };

    const adminMemberships = await scalar(
      sql`SELECT COUNT(*)::text AS count FROM identity.academy_memberships WHERE role = 'admin'`
    );
    report.actual.academyAdminMemberships = adminMemberships;

    // Issue detection
    const issues = report.issues as string[];

    if ((report.actual.academies as number) < TOTAL_ACADEMIES) {
      issues.push(
        `Incomplete academy seed: ${report.actual.academies}/${TOTAL_ACADEMIES} academies`
      );
    }
    if ((report.actual.nurseryRegistrations as number) < TOTAL_ACADEMIES) {
      issues.push(
        `Incomplete nursery registration: ${report.actual.nurseryRegistrations}/${TOTAL_ACADEMIES}`
      );
    }
    if (districtsIncomplete.length > 0) {
      issues.push(
        `${districtsIncomplete.length} districts have fewer than ${ACADEMIES_PER_DISTRICT} academies`
      );
    }
    if (districtsMissing.length > 0) {
      issues.push(`${districtsMissing.length} districts have zero academies`);
    }
    if (!sample) {
      issues.push(`Sample academy slug "${SEED_ACADEMY_SLUG}" not found`);
    }
    if (!stateAdmin) {
      issues.push("No state_admin user found");
    }
    if (adminMemberships < (report.actual.academies as number)) {
      issues.push(
        `Academy admin memberships (${adminMemberships}) fewer than academies (${report.actual.academies})`
      );
    }

    const expectedCoaches = expectedTotalCoaches();
    const expectedPlayers = expectedTotalPlayers();
    if ((report.actual.coaches as number) < expectedCoaches * 0.9) {
      issues.push(
        `Coach count low: ${report.actual.coaches} (expected ~${expectedCoaches} for full seed)`
      );
    }
    if ((report.actual.players as number) < expectedPlayers * 0.85) {
      issues.push(
        `Player count low: ${report.actual.players} (expected ~${expectedPlayers} for varied rosters)`
      );
    }

    const slugs = await sql<{ slug: string; district: string }[]>`
      SELECT slug, district FROM academy.academies WHERE deleted_at IS NULL ORDER BY slug
    `;
    report.actual.legacySlugs = slugs
      .filter((r) => r.slug === "dronacharya" || !r.slug.includes("-"))
      .map((r) => r.slug);
    report.actual.slugList = slugs.map((r) => r.slug);

    report.status =
      issues.length === 0 && (report.actual.academies as number) === TOTAL_ACADEMIES
        ? "SUCCESS"
        : (report.actual.academies as number) > 0
          ? "PARTIAL"
          : "FAILED";

    console.log(JSON.stringify(report, null, 2));
    process.exit(report.status === "SUCCESS" ? 0 : 1);
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
