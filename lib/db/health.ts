import { sql } from "drizzle-orm";
import { db } from "./client";

export type DbHealthResult = {
  status: "ok" | "error";
  latencyMs: number;
  message?: string;
};

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
] as const;

export async function checkDatabaseHealth(): Promise<DbHealthResult> {
  const start = Date.now();

  try {
    await db.execute(sql`SELECT 1 AS ok`);
    return { status: "ok", latencyMs: Date.now() - start };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { status: "error", latencyMs: Date.now() - start, message };
  }
}

export async function checkDatabaseSchema(): Promise<{
  ok: boolean;
  missingSchemas: string[];
}> {
  const rows = await db.execute<{ schema_name: string }>(sql`
    SELECT schema_name
    FROM information_schema.schemata
    WHERE schema_name IN (${sql.join(
      EXPECTED_SCHEMAS.map((name) => sql`${name}`),
      sql`, `
    )})
  `);

  const found = new Set(rows.map((row) => row.schema_name));
  const missingSchemas = EXPECTED_SCHEMAS.filter((name) => !found.has(name));

  return { ok: missingSchemas.length === 0, missingSchemas: [...missingSchemas] };
}
