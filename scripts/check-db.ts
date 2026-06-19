import postgres from "postgres";
import { loadEnv } from "../lib/load-env";
import { SEED_ACADEMY_SLUG } from "../lib/seed-constants";
import { TOTAL_ACADEMIES } from "../db/seed/bulk/distributions";

loadEnv();

const EXPECTED_SCHEMAS = [
  "identity",
  "academy",
  "people",
  "operations",
  "competitions",
  "inventory",
  "payroll",
  "training",
  "platform",
];

async function main() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    console.error("DATABASE_URL is missing from .env");
    process.exit(1);
  }

  const sql = postgres(url, { prepare: false, max: 1, connect_timeout: 10 });

  try {
    const start = Date.now();
    await sql`SELECT 1 AS ok`;
    const latencyMs = Date.now() - start;

    const schemas = await sql<{ schema_name: string }[]>`
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name IN ${sql(EXPECTED_SCHEMAS)}
      ORDER BY schema_name
    `;

    const foundSchemas = new Set(schemas.map((row) => row.schema_name));
    const missingSchemas = EXPECTED_SCHEMAS.filter((name) => !foundSchemas.has(name));

    if (missingSchemas.length > 0) {
      console.error("Connected, but schemas are missing:", missingSchemas.join(", "));
      console.error("Run: pnpm db:setup");
      process.exit(1);
    }

    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'academy'
      ORDER BY table_name
    `;

    if (tables.length === 0) {
      console.log("Connected, but academy schema is empty. Run: pnpm db:setup");
      process.exit(1);
    }

    const [academyCount] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM academy.academies WHERE deleted_at IS NULL
    `;

    const count = Number(academyCount?.count ?? 0);
    if (count !== TOTAL_ACADEMIES) {
      console.log(`Connected and migrated, but found ${count}/${TOTAL_ACADEMIES} academies. Run: pnpm db:seed`);
      process.exit(1);
    }

    const [nurseryCount] = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count
      FROM platform.state_nursery_registrations r
      INNER JOIN academy.academies a ON a.id = r.academy_id
      WHERE a.deleted_at IS NULL
    `;

    const nurseries = Number(nurseryCount?.count ?? 0);
    if (nurseries !== TOTAL_ACADEMIES) {
      console.log(`Connected but found ${nurseries}/${TOTAL_ACADEMIES} nursery registrations. Run: pnpm db:seed`);
      process.exit(1);
    }

    const [statusCounts] = await sql<{ verified: string; pending: string; flagged: string }[]>`
      SELECT
        COUNT(*) FILTER (WHERE r.verification_status = 'verified')::text AS verified,
        COUNT(*) FILTER (WHERE r.verification_status = 'pending')::text AS pending,
        COUNT(*) FILTER (WHERE r.verification_status = 'flagged')::text AS flagged
      FROM platform.state_nursery_registrations r
      INNER JOIN academy.academies a ON a.id = r.academy_id
      WHERE a.deleted_at IS NULL
    `;

    const [sample] = await sql<{ id: string; slug: string }[]>`
      SELECT id, slug FROM academy.academies WHERE slug = ${SEED_ACADEMY_SLUG} LIMIT 1
    `;

    if (!sample) {
      console.log(`Connected but sample academy slug "${SEED_ACADEMY_SLUG}" not found. Run: pnpm db:seed`);
      process.exit(1);
    }

    console.log("Database OK");
    console.log("  latency:", `${latencyMs}ms`);
    console.log("  schemas:", schemas.length);
    console.log("  academy tables:", tables.length);
    console.log("  academies:", count);
    console.log("  nurseries:", nurseryCount?.count ?? 0);
    console.log(
      "  verification:",
      `verified=${statusCounts?.verified ?? 0}`,
      `pending=${statusCounts?.pending ?? 0}`,
      `flagged=${statusCounts?.flagged ?? 0}`
    );
    console.log("  sample route id:", sample.id);
    console.log("  sample slug:", sample.slug);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Database check failed:", message);
    console.error("\nFix DATABASE_URL in .env (Supabase → Settings → Database → URI)");
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
