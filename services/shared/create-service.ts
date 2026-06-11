import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { formatServiceError } from "./errors";

type ServiceOptions = {
  name: string;
  port: number;
  routes: (app: Hono) => void;
};

export function createService({ name, port, routes }: ServiceOptions) {
  const app = new Hono();

  app.use("*", cors());
  app.get("/health", (c) => c.json({ status: "ok", service: name }));

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
