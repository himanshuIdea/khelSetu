# Khel Setu — Backend QA Report

**Date:** June 18, 2026  
**Environment:** Local dev (`pnpm dev` — Next.js `:3000` + microservices gateway `:4000`)  
**Test runner:** `pnpm exec tsx scripts/backend-qa.ts`  
**Database check:** `pnpm db:check` — OK (9 schemas, seed academy `dronacharya`)

---

## Executive summary

| Metric | Result |
|--------|--------|
| **Tests run** | 42 |
| **Passed** | 31 |
| **Failed** | 11 |
| **Overall backend health** | **Partially working** — core services and DB are up; several architectural gaps and security concerns |

**What works well**

- All 7 microservices + gateway respond on `/health` (200)
- Gateway `/health/ready` reports database OK
- Next.js auth: login, `/auth/me`, invalid-login → 401
- State admin nurseries API on Next.js (`/api/v1/state/nurseries`) — 200 with state admin session
- Academy read APIs via gateway return seeded data (players, coaches, teams, inventory, payroll, dashboard stats)
- Next.js-only routes for fees billing and timetable work when authenticated
- Slug availability check works on both gateway and Next.js

---

## Critical issues

### 1. Microservice read APIs have no authentication

**Severity:** Critical  
**Evidence:** Gateway endpoints return full academy data **without** a session cookie.

| Endpoint | Status (no auth) | Data returned |
|----------|------------------|---------------|
| `GET /api/v1/academies/{id}/players` | 200 | 8 players (names, IDs, sports) |
| `GET /api/v1/academies/{id}/coaches` | 200 | Coach roster |
| `GET /api/v1/academies/{id}/teams` | 200 | Team list |
| `GET /api/v1/academies/{id}/inventory/items` | 200 | Inventory items |
| `GET /api/v1/academies/{id}/payroll/staff` | 200 | Staff payslip data |

**Root cause:** Microservices under `services/{people,operations,competitions,inventory,payroll}/` expose GET handlers with no JWT or membership checks. Gateway proxies requests without forwarding auth headers.

**Impact:** Anyone who can reach `:4000` in dev/staging can read sensitive academy operational data.

**Recommendation:** Add auth middleware on the gateway (forward `Cookie` / `Authorization`, verify JWT, check academy membership) before proxying; or enforce auth inside each microservice.

---

### 2. `getAcademyMeta` crashes in academy microservice (HTTP 500)

**Severity:** High  
**Endpoint:** `GET http://localhost:4000/api/v1/academies/{academyId}/meta`  
**HTTP status:** 500

**Error:**
```
Invariant: incrementalCache missing in unstable_cache
```

**Root cause:** `lib/repositories/academy.ts` uses Next.js `unstable_cache()`, which requires the Next.js incremental cache runtime. The academy microservice (`services/academy/index.ts`) runs as a standalone Hono/Node process and calls the same repository function.

**Impact:** Any server-side code path that fetches academy meta via the gateway (instead of direct repository import) fails. Slug availability works; meta does not.

**Recommendation:** Split `getAcademyMeta` into a plain DB function for microservices and keep `unstable_cache` wrapper only in Next.js RSC paths (or use a shared in-memory cache in services).

---

## High issues

### 3. Gateway proxy is incomplete vs Next.js API surface

**Severity:** High  
**Evidence:** Multiple routes exist only on Next.js (`app/api/v1/*`) and return **404** on the gateway.

| Route | Gateway | Next.js (authenticated) |
|-------|---------|-------------------------|
| `POST /auth/login` | 404 | 200 |
| `GET /state/nurseries` | 404 | 200 |
| `GET /academies/{id}/fees/billing` | 404 | 200 |
| `GET /academies/{id}/timetable` | 404 | 200 |

**Root cause:** `services/gateway/index.ts` only registers a subset of read routes. Auth, state portal, fees, timetable, attendance mutations, coach/player portals, credentials, and onboarding are Next.js-only.

**Impact:** `lib/api/http.ts` routes server-side `api.*` calls to `gatewayUrl` (`:4000`). Any server component using `api.academy.*` for fees/timetable/auth will fail outside the browser. Browser client code works because it uses same-origin Next.js routes.

**Recommendation:** Either (a) expand gateway proxy to cover all `app/api/v1` routes, or (b) change `resolveApiRoot()` so server-side calls also hit Next.js (with cookie forwarding), or (c) document that server code must use repositories directly (already the pattern for RSC pages).

---

### 4. Seed academy ID constant does not match database

**Severity:** High (local dev / test reliability)  
**File:** `lib/seed-constants.ts`

| Source | Academy ID |
|--------|------------|
| `SEED_ACADEMY_ID` constant | `a1000000-0000-4000-8000-000000000001` |
| Database (`slug = dronacharya`) | `8d5f61eb-13de-44a2-955d-84106f371f2d` |
| Session (`/auth/me`) | `8d5f61eb-13de-44a2-955d-84106f371f2d` |

**Evidence:** Requests to gateway with the hardcoded constant return **0 players**; requests with the DB ID return **8 players**.

**Root cause:** Seed uses `onConflictDoUpdate` on `academies.slug`, so re-seeding updates the row in place but does not change the existing UUID. The constant in code is stale.

**Recommendation:** Use `SEED_ACADEMY_ID` in the seed `insert` via `.values({ id: SEED_ACADEMY_ID, ... })` with a one-time migration, or resolve academy by slug everywhere instead of hardcoded UUID.

---

## Medium issues

### 5. Player create validation throws 500 on malformed body

**Severity:** Medium  
**Endpoint:** `POST /api/v1/academies/{id}/players`  
**HTTP status:** 500 (expected 400)

**Root cause:** `validatePlayerPayload` in `lib/players.ts` calls `payload.sportId.trim()` without guarding for `undefined`. A body missing `sportId` (e.g. `{ fullName, sport }`) throws a `TypeError`, caught by the route handler and returned as 500.

```typescript
if (!payload.sportId.trim()) return "Sport is required.";
```

**Recommendation:** Use optional chaining: `if (!payload.sportId?.trim())`.

---

### 6. OTP authentication is a stub (accepts any non-empty OTP)

**Severity:** Medium (security, if OTP is exposed in production)  
**File:** `lib/auth/otp.ts`

```typescript
export async function verifyOtpChallenge(_phone: string, otp: string) {
  return otp.trim().length > 0;
}
```

**Impact:** Any non-empty OTP string passes verification for register/login OTP mode.

**Recommendation:** Integrate a real SMS OTP provider before enabling OTP in production; hide OTP mode in prod until then.

---

### 7. No automated test suite for backend

**Severity:** Medium  
**Evidence:** No `test` script in `package.json`; no Vitest/Jest/Playwright test files for API routes.

**Impact:** Regressions (gateway gaps, auth bypass, validation crashes) are only caught manually.

**Recommendation:** Add `scripts/backend-qa.ts` to CI and expand with mutation/auth-negative cases.

---

## Low issues

### 8. Next.js has no `/health` endpoint

**Severity:** Low  
**Evidence:** `GET http://localhost:3000/health` → 404

**Recommendation:** Add a lightweight `app/health/route.ts` for orchestration/monitoring.

---

### 9. Slow page/API response times observed

**Severity:** Low (performance)  
**Evidence from running dev server logs:**

| Route | Response time |
|-------|---------------|
| `/player/home` | 8–10 s |
| `/coach/media` | 5–6 s |
| `GET /api/v1/academies/slug/.../available` (Next.js) | ~1.1 s (first run) |
| `GET /api/v1/.../dashboard/stats` (gateway) | ~400–900 ms |

**Note:** DB round-trip latency measured at ~285–358 ms via `db:check` / gateway ready check (Supabase pooler).

**Recommendation:** Profile RSC pages with many serial repository calls; ensure `Promise.all` for independent fetches; consider connection pooling tuning.

---

## Passing checks (reference)

| Area | Status |
|------|--------|
| Gateway + 6 microservices `/health` | Pass |
| Gateway `/health/ready` + DB | Pass |
| Academy admin login (Next.js) | Pass |
| State admin login + nurseries list (Next.js) | Pass |
| Invalid login returns 401 | Pass |
| Invalid academy UUID returns 400 on meta | Pass |
| Unauthenticated `/auth/me` returns 401 | Pass |
| Slug availability (gateway + Next.js) | Pass |
| Fees billing + timetable (Next.js, authenticated) | Pass |
| Dashboard stats, players, coaches, teams, inventory, payroll (gateway) | Pass (data present) |

---

## Architecture notes (not bugs, but worth tracking)

1. **Dual API layer:** RSC pages correctly use `lib/repositories/*` directly; client mutations use Next.js `app/api/v1/*`. Gateway is read-only today and lacks auth — intentional per `WORKLOG.md` but risky if `:4000` is exposed.
2. **Write operations** (POST/PATCH/DELETE) are implemented on Next.js routes with session checks (`requireSessionUserId`, `_auth.ts` helpers) — not on gateway microservices.
3. **71 Next.js API route files** vs **~25 gateway proxy routes** — large coverage gap.

---

## How to re-run

```bash
cd khel-setu
pnpm db:check                    # database connectivity
pnpm exec tsx scripts/backend-qa.ts   # full smoke suite (writes backend-qa-results.json)
```

Requires `.env` with `DATABASE_URL`, `SEED_ACADEMY_ADMIN_*`, and `STATE_ADMIN_*` for auth tests.

---

## Suggested fix priority

1. **P0** — Add authentication to gateway/microservice read paths  
2. **P0** — Fix `getAcademyMeta` for non-Next.js runtime  
3. **P1** — Align `SEED_ACADEMY_ID` with database or resolve by slug  
4. **P1** — Fix player validation null-safety (`sportId?.trim()`)  
5. **P2** — Complete gateway proxy or unify server-side API routing  
6. **P2** — Replace OTP stub before production  
7. **P3** — Add `/health` on Next.js; wire QA script into CI
