import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { checkDatabaseHealth } from "@/lib/db/health";
import { createServiceAuthMiddleware } from "./auth-middleware";
import { formatServiceError } from "./errors";

type ServiceOptions = {
  name: string;
  port: number;
  routes: (app: Hono) => void;
  /** When true, exposes /health/ready with a live PostgreSQL probe. */
  dbHealth?: boolean;
  /** When true, requires session + academy membership on academy routes (gateway only). */
  requireAuth?: boolean;
  /** Extra path patterns that skip auth (e.g. slug availability). */
  publicPaths?: RegExp[];
};

export function createService({
  name,
  port,
  routes,
  dbHealth = false,
  requireAuth = false,
  publicPaths = [],
}: ServiceOptions) {
  const app = new Hono();

  app.use("*", cors());
  app.get("/health", (c) => c.json({ status: "ok", service: name }));

  if (dbHealth) {
    app.get("/health/ready", async (c) => {
      const database = await checkDatabaseHealth();
      const ready = database.status === "ok";
      return c.json({ status: ready ? "ok" : "degraded", service: name, database }, ready ? 200 : 503);
    });
  }

  if (requireAuth) {
    app.use("*", createServiceAuthMiddleware(publicPaths));
  }

  routes(app);

  app.onError((err, c) => {
    console.error(`[${name}]`, err);
    const { message, status } = formatServiceError(err);
    return c.json({ error: message }, status as 500 | 503);
  });

  app.notFound((c) => c.json({ error: "Not found" }, 404));

  serve({ fetch: app.fetch, port }, () => {
    console.log(`[${name}] listening on http://localhost:${port}`);
  });

  return app;
}
