/**
 * Compare state portal routes: dev (next dev) vs prod (next start).
 * Run: pnpm exec tsx scripts/state-prod-qa.ts [--dev-port 3000] [--prod-port 3001]
 */
import { loadEnv } from "@/lib/load-env";

loadEnv();

type ProbeResult = {
  name: string;
  mode: "dev" | "prod";
  status: number;
  durationMs: number;
  detail?: string;
  headers?: Record<string, string>;
};

const results: ProbeResult[] = [];

function arg(name: string, fallback: string): string {
  const idx = process.argv.indexOf(name);
  return idx >= 0 ? (process.argv[idx + 1] ?? fallback) : fallback;
}

async function timedFetch(url: string, init?: RequestInit): Promise<{ response: Response; durationMs: number }> {
  const start = Date.now();
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(120_000) });
  return { response, durationMs: Date.now() - start };
}

async function login(base: string): Promise<string | undefined> {
  const email = process.env.STATE_ADMIN_EMAIL?.trim();
  const password = process.env.STATE_ADMIN_PASSWORD?.trim();
  if (!email || !password) return undefined;

  const { response } = await timedFetch(`${base}/api/v1/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      mode: "password",
      identifier: email,
      password,
      portal: "state",
    }),
  });

  const cookies = response.headers.getSetCookie?.() ?? [];
  return cookies.map((c) => c.split(";")[0]).join("; ") || undefined;
}

async function probePage(
  mode: "dev" | "prod",
  base: string,
  path: string,
  cookie?: string,
  label?: string
) {
  const name = label ?? path;
  try {
    const { response, durationMs } = await timedFetch(`${base}${path}`, {
      headers: cookie ? { cookie } : undefined,
      redirect: "manual",
    });
    const location = response.headers.get("location");
    results.push({
      name,
      mode,
      status: response.status,
      durationMs,
      detail: location ? `redirect→${location}` : undefined,
    });
  } catch (e) {
    results.push({
      name,
      mode,
      status: 0,
      durationMs: 0,
      detail: e instanceof Error ? e.message : String(e),
    });
  }
}

async function probeApi(
  mode: "dev" | "prod",
  base: string,
  path: string,
  cookie: string | undefined,
  init?: RequestInit,
  label?: string
) {
  const name = label ?? path;
  try {
    const { response, durationMs } = await timedFetch(`${base}${path}`, {
      ...init,
      headers: { "content-type": "application/json", cookie: cookie ?? "", ...init?.headers },
    });
    const bodySnippet = await response.text().then((t) => t.slice(0, 120)).catch(() => "");
    results.push({
      name,
      mode,
      status: response.status,
      durationMs,
      detail: bodySnippet,
      headers: {
        "set-cookie-secure": response.headers.get("set-cookie")?.includes("Secure") ? "yes" : "no",
        "report-timing": response.headers.get("x-report-timing-ms") ?? "",
      },
    });
  } catch (e) {
    results.push({
      name,
      mode,
      status: 0,
      durationMs: 0,
      detail: e instanceof Error ? e.message : String(e),
    });
  }
}

async function probeEnv(base: string, mode: "dev" | "prod") {
  try {
    const { response, durationMs } = await timedFetch(`${base}/health`);
    const body = (await response.json().catch(() => ({}))) as { env?: string; nodeEnv?: string };
    results.push({
      name: "health",
      mode,
      status: response.status,
      durationMs,
      detail: JSON.stringify(body),
    });
  } catch (e) {
    results.push({
      name: "health",
      mode,
      status: 0,
      durationMs: 0,
      detail: e instanceof Error ? e.message : String(e),
    });
  }
}

async function runMode(mode: "dev" | "prod", port: string) {
  const base = `http://localhost:${port}`;
  const reachable = await fetch(`${base}/health`, { signal: AbortSignal.timeout(3000) })
    .then((r) => r.ok)
    .catch(() => false);

  if (!reachable) {
    results.push({
      name: "server-reachable",
      mode,
      status: 0,
      durationMs: 0,
      detail: `No server on port ${port}`,
    });
    return;
  }

  results.push({ name: "server-reachable", mode, status: 200, durationMs: 0, detail: port });

  await probeEnv(base, mode);

  const cookie = await login(base);
  results.push({
    name: "auth:login",
    mode,
    status: cookie ? 200 : 401,
    durationMs: 0,
    detail: cookie ? "session cookie received" : "login failed or STATE_ADMIN_* missing",
  });

  const pages = [
    "/state/overview",
    "/state/nurseries",
    "/state/districts",
    "/state/funds",
    "/state/reports",
    "/state/scouting",
    "/state/verification",
    "/state/athletes",
    "/state/nurseries/requests",
  ];

  for (const path of pages) {
    await probePage(mode, base, path, cookie);
  }

  await probeApi(mode, base, "/api/v1/state/nurseries", cookie);
  await probeApi(mode, base, "/api/v1/state/funds", cookie);
  await probeApi(
    mode,
    base,
    "/api/v1/state/reports/generate",
    cookie,
    {
      method: "POST",
      body: JSON.stringify({ reportType: "district-performance", format: "xlsx" }),
    },
    "api:reports-generate-xlsx"
  );
  await probeApi(
    mode,
    base,
    "/api/v1/state/reports/generate",
    cookie,
    {
      method: "POST",
      body: JSON.stringify({ reportType: "full-state", format: "pdf" }),
    },
    "api:reports-generate-pdf-full"
  );
}

function compareResults() {
  const diffs: string[] = [];
  const byName = new Map<string, { dev?: ProbeResult; prod?: ProbeResult }>();

  for (const r of results) {
    const entry = byName.get(r.name) ?? {};
    entry[r.mode] = r;
    byName.set(r.name, entry);
  }

  for (const [name, { dev, prod }] of byName) {
    if (!dev || !prod) continue;
    if (dev.status !== prod.status) {
      diffs.push(`${name}: status dev=${dev.status} prod=${prod.status}`);
    } else if (dev.status >= 200 && dev.status < 300 && prod.durationMs > dev.durationMs * 2 && prod.durationMs > 3000) {
      diffs.push(`${name}: prod ${prod.durationMs}ms vs dev ${dev.durationMs}ms (>2× slower)`);
    }
  }

  return diffs;
}

async function main() {
  const devPort = arg("--dev-port", "3000");
  const prodPort = arg("--prod-port", "3001");

  console.error(`Probing dev :${devPort} and prod :${prodPort}...`);
  await runMode("dev", devPort);
  await runMode("prod", prodPort);

  const diffs = compareResults();
  const summary = {
    probedAt: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV ?? "development",
    cookieSecureDefault: process.env.NODE_ENV === "production",
    envVars: {
      DATABASE_URL: Boolean(process.env.DATABASE_URL),
      JWT_SECRET: Boolean(process.env.JWT_SECRET),
      STATE_ADMIN_EMAIL: Boolean(process.env.STATE_ADMIN_EMAIL),
      COOKIE_SECURE: process.env.COOKIE_SECURE ?? "(unset)",
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "(unset)",
    },
    diffCount: diffs.length,
    diffs,
    results,
  };

  const outPath = new URL("../STATE_PROD_QA.log.json", import.meta.url);
  await import("node:fs/promises").then((fs) =>
    fs.writeFile(outPath, JSON.stringify(summary, null, 2))
  );

  console.log(JSON.stringify(summary, null, 2));
  process.exit(diffs.some((d) => d.includes("status")) ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
