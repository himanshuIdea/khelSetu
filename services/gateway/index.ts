import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { loadEnv } from "../../lib/load-env";
import { servicePorts, serviceUrls } from "../shared/config";
import { formatServiceError } from "../shared/errors";
import { proxyRequest } from "../shared/proxy";

loadEnv();

const app = new Hono();

app.use("*", cors());
app.get("/health", (c) =>
  c.json({
    status: "ok",
    service: "api-gateway",
    version: "v1",
  })
);

const v1 = new Hono();

// Academy service
v1.all("/academies/:academyId/meta", (c) =>
  proxyRequest(c, serviceUrls.academy, `/academies/${c.req.param("academyId")}/meta`)
);
v1.all("/academies/slug/:slug/available", (c) =>
  proxyRequest(c, serviceUrls.academy, `/academies/slug/${c.req.param("slug")}/available`)
);
v1.all("/academies/onboarding", (c) =>
  proxyRequest(c, serviceUrls.academy, "/academies/onboarding")
);

// People service
v1.all("/academies/:academyId/players", (c) =>
  proxyRequest(c, serviceUrls.people, `/academies/${c.req.param("academyId")}/players`)
);
v1.all("/academies/:academyId/players/counts", (c) =>
  proxyRequest(c, serviceUrls.people, `/academies/${c.req.param("academyId")}/players/counts`)
);
v1.all("/academies/:academyId/players/:externalId", (c) =>
  proxyRequest(
    c,
    serviceUrls.people,
    `/academies/${c.req.param("academyId")}/players/${c.req.param("externalId")}`
  )
);
v1.all("/academies/:academyId/coaches", (c) =>
  proxyRequest(c, serviceUrls.people, `/academies/${c.req.param("academyId")}/coaches`)
);
v1.all("/academies/:academyId/coaches/count", (c) =>
  proxyRequest(c, serviceUrls.people, `/academies/${c.req.param("academyId")}/coaches/count`)
);
v1.all("/academies/:academyId/coaches/pending-reviews", (c) =>
  proxyRequest(
    c,
    serviceUrls.people,
    `/academies/${c.req.param("academyId")}/coaches/pending-reviews`
  )
);

// Operations service
v1.all("/academies/:academyId/dashboard/stats", (c) =>
  proxyRequest(
    c,
    serviceUrls.operations,
    `/academies/${c.req.param("academyId")}/dashboard/stats`
  )
);
v1.all("/academies/:academyId/dashboard/players-by-sport", (c) =>
  proxyRequest(
    c,
    serviceUrls.operations,
    `/academies/${c.req.param("academyId")}/dashboard/players-by-sport`
  )
);
v1.all("/academies/:academyId/dashboard/today-sessions", (c) =>
  proxyRequest(
    c,
    serviceUrls.operations,
    `/academies/${c.req.param("academyId")}/dashboard/today-sessions`
  )
);
v1.all("/academies/:academyId/dashboard/activity", (c) =>
  proxyRequest(
    c,
    serviceUrls.operations,
    `/academies/${c.req.param("academyId")}/dashboard/activity`
  )
);
v1.all("/academies/:academyId/attendance/sessions", (c) =>
  proxyRequest(
    c,
    serviceUrls.operations,
    `/academies/${c.req.param("academyId")}/attendance/sessions`
  )
);

// Competitions service
v1.all("/academies/:academyId/teams/featured", (c) =>
  proxyRequest(
    c,
    serviceUrls.competitions,
    `/academies/${c.req.param("academyId")}/teams/featured`
  )
);
v1.all("/academies/:academyId/teams/members", (c) =>
  proxyRequest(
    c,
    serviceUrls.competitions,
    `/academies/${c.req.param("academyId")}/teams/members`
  )
);
v1.all("/academies/:academyId/teams", (c) =>
  proxyRequest(c, serviceUrls.competitions, `/academies/${c.req.param("academyId")}/teams`)
);
v1.all("/academies/:academyId/tournaments/active", (c) =>
  proxyRequest(
    c,
    serviceUrls.competitions,
    `/academies/${c.req.param("academyId")}/tournaments/active`
  )
);
v1.all("/academies/:academyId/tournaments/active/id", (c) =>
  proxyRequest(
    c,
    serviceUrls.competitions,
    `/academies/${c.req.param("academyId")}/tournaments/active/id`
  )
);
v1.all("/tournaments/:tournamentId/bracket", (c) =>
  proxyRequest(
    c,
    serviceUrls.competitions,
    `/tournaments/${c.req.param("tournamentId")}/bracket`
  )
);
v1.all("/tournaments/:tournamentId/mat-schedule", (c) =>
  proxyRequest(
    c,
    serviceUrls.competitions,
    `/tournaments/${c.req.param("tournamentId")}/mat-schedule`
  )
);

// Inventory service
v1.all("/academies/:academyId/inventory/stats", (c) =>
  proxyRequest(
    c,
    serviceUrls.inventory,
    `/academies/${c.req.param("academyId")}/inventory/stats`
  )
);
v1.all("/academies/:academyId/inventory/items", (c) =>
  proxyRequest(
    c,
    serviceUrls.inventory,
    `/academies/${c.req.param("academyId")}/inventory/items`
  )
);
v1.all("/academies/:academyId/inventory/movements", (c) =>
  proxyRequest(
    c,
    serviceUrls.inventory,
    `/academies/${c.req.param("academyId")}/inventory/movements`
  )
);

// Payroll service
v1.all("/academies/:academyId/payroll/stats", (c) =>
  proxyRequest(c, serviceUrls.payroll, `/academies/${c.req.param("academyId")}/payroll/stats`)
);
v1.all("/academies/:academyId/payroll/staff", (c) =>
  proxyRequest(c, serviceUrls.payroll, `/academies/${c.req.param("academyId")}/payroll/staff`)
);

app.route("/api/v1", v1);

app.onError((err, c) => {
  console.error("[api-gateway]", err);
  const { message, status } = formatServiceError(err);
  return c.json({ error: message }, status as 500 | 503);
});

app.notFound((c) => c.json({ error: "Not found" }, 404));

serve({ fetch: app.fetch, port: servicePorts.gateway }, () => {
  console.log(`[api-gateway] listening on http://localhost:${servicePorts.gateway}`);
});
