/**
 * Full-app production smoke — run against `pnpm start:demo` (default :3001).
 * Usage: PROD_PORT=3001 pnpm qa:demo-prod
 */
import { loadEnv } from "@/lib/load-env";
import { SEED_ACADEMY_SLUG } from "@/lib/seed-constants";

loadEnv();

const base = `http://localhost:${process.env.PROD_PORT ?? "3001"}`;

async function probe(label: string, cookie: string, path: string, init?: RequestInit, timeoutMs = 45_000) {
  const t0 = Date.now();
  try {
    const res = await fetch(`${base}${path}`, {
      ...init,
      headers: { cookie: cookie || "", ...(init?.headers ?? {}) },
      signal: AbortSignal.timeout(timeoutMs),
    });
    const ms = Date.now() - t0;
    const ok = res.status >= 200 && res.status < 400;
    console.log(`${ok ? "OK" : "FAIL"}\t${label}\t${res.status}\t${ms}ms`);
    return { label, status: res.status, ms, ok };
  } catch (e) {
    const ms = Date.now() - t0;
    console.log(`ERR\t${label}\t0\t${ms}ms\t${e instanceof Error ? e.message : e}`);
    return { label, status: 0, ms, ok: false };
  }
}

async function login(
  portal: "state" | "academy" | "coach" | "player",
  identifier: string,
  password: string
) {
  const t0 = Date.now();
  const res = await fetch(`${base}/api/v1/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ mode: "password", identifier, password, portal }),
    signal: AbortSignal.timeout(20_000),
  });
  const ms = Date.now() - t0;
  const cookies = res.headers.getSetCookie?.() ?? [];
  console.log(`login-${portal}\t${res.status}\t${ms}ms`);
  return { cookie: cookies.map((c) => c.split(";")[0]).join("; "), ok: res.ok, ms };
}

async function logout(cookie: string) {
  await fetch(`${base}/api/v1/auth/logout`, {
    method: "POST",
    headers: { cookie, "content-type": "application/json" },
    body: "{}",
    signal: AbortSignal.timeout(15_000),
  });
}

async function resolveAcademyId(cookie: string): Promise<string | null> {
  const res = await fetch(`${base}/api/v1/auth/me`, {
    headers: { cookie },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { academies?: { id: string }[] };
  return body.academies?.[0]?.id ?? null;
}

async function main() {
  console.log(`\n=== Demo prod smoke @ ${base} ===\n`);
  const results: { label: string; ok: boolean }[] = [];

  results.push(
    ...(await Promise.all([
      probe("auth-state-login-page", "", "/auth/state/login"),
      probe("auth-academy-login-page", "", "/auth/login"),
      probe("health", "", "/health"),
    ])).map((r) => ({ label: r.label, ok: r.ok }))
  );

  const stateEmail = process.env.STATE_ADMIN_EMAIL?.trim();
  const statePassword = process.env.STATE_ADMIN_PASSWORD?.trim();
  if (stateEmail && statePassword) {
    const { cookie, ok, ms: loginMs } = await login("state", stateEmail, statePassword);
    if (ok) {
      results.push({
        label: "state-login",
        ok: loginMs < 20_000,
      });

      const overviewShell = await probe(
        "state overview shell",
        cookie,
        "/state/overview",
        undefined,
        15_000
      );
      results.push({
        label: overviewShell.label,
        ok: overviewShell.ok && overviewShell.ms < 15_000,
      });

      const overviewApi = await probe(
        "state overview api",
        cookie,
        "/api/v1/state/overview",
        undefined,
        55_000
      );
      results.push({
        label: overviewApi.label,
        ok: overviewApi.ok && overviewApi.ms < 55_000,
      });

      for (const path of [
        "/state/overview",
        "/state/reports",
        "/state/funds",
        "/state/scouting",
        "/state/verification",
      ]) {
        const r = await probe(`state ${path}`, cookie, path);
        results.push({ label: r.label, ok: r.ok });
      }
      const report = await probe("state report-xlsx", cookie, "/api/v1/state/reports/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reportType: "district-performance", format: "xlsx" }),
      }, 90_000);
      results.push({ label: report.label, ok: report.ok });

      await logout(cookie);
      const relogin = await login("state", stateEmail, statePassword);
      results.push({
        label: "state-relogin",
        ok: relogin.ok && relogin.ms < 20_000,
      });
    } else {
      results.push({ label: "state-login", ok: false });
    }
  } else {
    console.log("SKIP\tstate portal\tSTATE_ADMIN_EMAIL/PASSWORD not set");
  }

  const bulkDomain = process.env.BULK_ADMIN_EMAIL_DOMAIN?.trim() || "haryana-sports.in";
  const academyEmail =
    process.env.BULK_ADMIN_EMAIL?.trim() || `admin-${SEED_ACADEMY_SLUG}@${bulkDomain}`;
  const academyPassword = process.env.BULK_ADMIN_PASSWORD?.trim();
  if (academyEmail && academyPassword) {
    const { cookie, ok } = await login("academy", academyEmail, academyPassword);
    if (ok) {
      const academyId = await resolveAcademyId(cookie);
      if (academyId) {
        for (const path of [
          `/academy/${academyId}`,
          `/academy/${academyId}/players`,
          `/academy/${academyId}/attendance`,
          `/academy/${academyId}/teams`,
        ]) {
          const r = await probe(`academy ${path}`, cookie, path);
          results.push({ label: r.label, ok: r.ok });
        }
      } else {
        console.log("FAIL\tacademy-id\tcould not resolve from /auth/me");
        results.push({ label: "academy-id", ok: false });
      }
    } else {
      results.push({ label: "academy-login", ok: false });
    }
  } else {
    console.log("SKIP\tacademy portal\tBULK_ADMIN_PASSWORD not set");
  }

  const coachId = process.env.DEMO_COACH_IDENTIFIER?.trim();
  const coachPassword = process.env.DEMO_COACH_PASSWORD?.trim();
  if (coachId && coachPassword) {
    const { cookie, ok } = await login("coach", coachId, coachPassword);
    if (ok) {
      const r = await probe("coach home", cookie, "/coach");
      results.push({ label: r.label, ok: r.ok });
    } else {
      results.push({ label: "coach-login", ok: false });
    }
  } else {
    console.log("SKIP\tcoach portal\tset DEMO_COACH_IDENTIFIER + DEMO_COACH_PASSWORD to test");
    const r = await probe("coach login page", "", "/auth/coach/login");
    results.push({ label: r.label, ok: r.ok });
  }

  const playerId = process.env.DEMO_PLAYER_IDENTIFIER?.trim();
  const playerPassword = process.env.DEMO_PLAYER_PASSWORD?.trim();
  if (playerId && playerPassword) {
    const { cookie, ok } = await login("player", playerId, playerPassword);
    if (ok) {
      const r = await probe("player home", cookie, "/player/home");
      results.push({ label: r.label, ok: r.ok });
    } else {
      results.push({ label: "player-login", ok: false });
    }
  } else {
    console.log("SKIP\tplayer portal\tset DEMO_PLAYER_IDENTIFIER + DEMO_PLAYER_PASSWORD to test");
    const r = await probe("player login page", "", "/auth/player/login");
    results.push({ label: r.label, ok: r.ok });
  }

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n=== Summary: ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
