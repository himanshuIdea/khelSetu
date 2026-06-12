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
  // Keep dev connection usage low across Next.js + microservices.
  return process.env.NODE_ENV === "production" ? 10 : 2;
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
  const client = globalForDb.client ?? createClient();
  if (process.env.NODE_ENV !== "production") {
    globalForDb.client = client;
  }
  return drizzle(client, { schema });
}

export const db: Database = new Proxy({} as Database, {
  get(_target, prop, receiver) {
    if (!globalForDb.db) {
      globalForDb.db = createDb();
    }
    return Reflect.get(globalForDb.db, prop, receiver);
  },
});
