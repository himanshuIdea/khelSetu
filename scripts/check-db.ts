import postgres from "postgres";
import { loadEnv } from "../lib/load-env";

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

    const [academy] = await sql<{ id: string; slug: string }[]>`
      SELECT id, slug FROM academy.academies WHERE slug = 'dronacharya' LIMIT 1
    `;

    if (!academy) {
      console.log("Connected and migrated, but no seed data. Run: pnpm db:seed");
      process.exit(1);
    }

    console.log("Database OK");
    console.log("  latency:", `${latencyMs}ms`);
    console.log("  schemas:", schemas.length);
    console.log("  academy tables:", tables.length);
    console.log("  seed route id:", academy.id);
    console.log("  branded link:", `${academy.slug}.khelsetu.in`);
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
