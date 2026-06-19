import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";
import { loadEnv } from "@/lib/load-env";

loadEnv();

type Database = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  client: ReturnType<typeof postgres> | undefined;
  db: Database | undefined;
};

function resolvePoolMax(): number {
  const configured = process.env.DATABASE_POOL_MAX;
  if (configured) {
    const parsed = Number(configured);
    if (!Number.isNaN(parsed) && parsed > 0) return parsed;
  }
  // Local dev runs many parallel state aggregates; serverless stays at 1.
  return process.env.NODE_ENV === "production" ? 1 : 10;
}

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  return postgres(connectionString, {
    prepare: false,
    max: resolvePoolMax(),
    idle_timeout: 20,
    connect_timeout: 10,
  });
}

function createDb(): Database {
  if (!globalForDb.client) {
    globalForDb.client = createClient();
  }
  if (!globalForDb.db) {
    globalForDb.db = drizzle(globalForDb.client, { schema });
  }
  return globalForDb.db;
}

export const db: Database = new Proxy({} as Database, {
  get(_target, prop, receiver) {
    return Reflect.get(createDb(), prop, receiver);
  },
});
