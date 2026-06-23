import { loadEnv } from "@/lib/load-env";

loadEnv();

async function probe(
  label: string,
  base: string,
  cookie: string,
  path: string,
  init?: RequestInit,
  timeoutMs = 45_000
) {
  const t0 = Date.now();
  try {
    const res = await fetch(`${base}${path}`, {
      ...init,
      headers: { cookie: cookie || "", ...(init?.headers ?? {}) },
      signal: AbortSignal.timeout(timeoutMs),
    });
    const ms = Date.now() - t0;
    const text = await res.text();
    console.log(`${label}\t${res.status}\t${ms}ms\t${text.slice(0, 80).replace(/\n/g, " ")}`);
    return { label, status: res.status, ms };
  } catch (e) {
    const ms = Date.now() - t0;
    console.log(`${label}\tERR\t${ms}ms\t${e instanceof Error ? e.message : e}`);
    return { label, status: 0, ms };
  }
}

async function login(base: string) {
  const res = await fetch(`${base}/api/v1/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      mode: "password",
      identifier: process.env.STATE_ADMIN_EMAIL,
      password: process.env.STATE_ADMIN_PASSWORD,
      portal: "state",
    }),
    signal: AbortSignal.timeout(15_000),
  });
  const cookies = res.headers.getSetCookie?.() ?? [];
  const secure = cookies.some((c) => /;\s*Secure/i.test(c));
  console.log(`login-${base}\t${res.status}\tsecure=${secure}`);
  return cookies.map((c) => c.split(";")[0]).join("; ");
}

async function run(base: string, tag: string) {
  console.log(`\n=== ${tag} ${base} ===`);
  const cookie = await login(base);
  const paths = [
    "/state/overview",
    "/state/reports",
    "/state/funds",
    "/api/v1/state/nurseries",
    "/api/v1/state/funds",
  ];
  const out = [];
  for (const p of paths) {
    out.push(await probe(`${tag} ${p}`, base, cookie, p));
  }
  out.push(
    await probe(`${tag} report-xlsx`, base, cookie, "/api/v1/state/reports/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reportType: "district-performance", format: "xlsx" }),
    }, 60_000)
  );
  out.push(
    await probe(`${tag} report-pdf-full`, base, cookie, "/api/v1/state/reports/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reportType: "full-state", format: "pdf" }),
    }, 120_000)
  );
  return out;
}

async function main() {
  const devPort = process.env.DEV_PORT ?? "3000";
  const prodPort = process.env.PROD_PORT ?? "3001";
  const prodOnly = process.env.PROD_ONLY === "1" || process.env.PROD_ONLY === "true";
  if (!prodOnly) {
    await run(`http://localhost:${devPort}`, "DEV");
  }
  await run(`http://localhost:${prodPort}`, "PROD");
}

main();
