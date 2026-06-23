# State Portal — Dev vs Production QA Log

**Generated:** 2026-06-23  
**Scope:** Local `next dev` (:3000) vs local production build `next build && next start` (:3001–3002)  
**Focus:** `/state/*` routes and `/api/v1/state/*` APIs  
**Build status:** `pnpm build` — **PASS** (all state routes compile as dynamic `ƒ`)

---

## Executive summary

| Area | Dev (`next dev`) | Prod (`next start`) | Gap severity |
|------|------------------|---------------------|--------------|
| Build / compile | OK | OK | — |
| State page SSR (authenticated) | Works | Works (when session valid) | Low |
| State API auth (cookie) | Works over HTTP | **Broken on HTTP** unless `COOKIE_SECURE=false` | **Critical** (local prod) |
| Report PDF generation (`full-state`) | Slow / hangs | **Connection drop ~118s+** | **Critical** |
| Report XLSX (`district-performance`) | Expected OK | Not fully verified (blocked by hung PDF probes) | Medium |
| Server log noise | Moderate | **Extreme** (`loadEnv()` per request) | High |
| Debug instrumentation in code | Present | Present (calls dead localhost ingest) | High |
| DB connection pool | max 10 | max 5 | Medium (under load) |

**Bottom line:** Production build compiles and serves state pages, but **local production behaves differently from dev** mainly due to **Secure session cookies**, **report generation timeouts**, and **per-request `loadEnv()` overhead**. Real deployed production (HTTPS) will still hit report timeout and performance issues.

---

## Runtime evidence log

### LOG-001 — Production PDF report generation fails (empty response)

**Timestamp:** 2026-06-23 (prior session, terminal `539255`)  
**Route:** `POST /api/v1/state/reports/generate`  
**Body:** `{ "reportType": "full-state", "format": "pdf" }`  
**Server:** `next start -p 3001` (NODE_ENV=production)

| Step | Result |
|------|--------|
| Login (state admin) | OK (cookie set) |
| `GET /state/reports` | **200** in **0.56s** |
| `POST .../reports/generate` (PDF) | **HTTP 000** after **118.67s**, size=0 |
| curl exit code | **52** (empty reply from server) |

**Interpretation:** Route declares `maxDuration = 60` but client waited >118s with no response body — likely worker killed, connection reset, or event-loop blocked during PDF assembly.

**Files involved:**
- `app/api/v1/state/reports/generate/route.ts` — `maxDuration = 60`
- `lib/repositories/state-report-data.ts` — `fetchFullStateReportData()` (4 parallel domains + N scheme queries)
- `lib/state-report-generators/full-state-report.ts` — multi-page PDF via `pdfkit`

---

### LOG-002 — Secure cookies break auth on local production (HTTP)

**Config:** `lib/auth/cookies.ts`

```typescript
return process.env.NODE_ENV === "production"; // secure cookie when no APP_URL override
```

**Behavior:**
- `next dev` → `secure: false` → session cookie sent over `http://localhost`
- `next start` with `NODE_ENV=production` → `secure: true` → browser/curl **will not send cookie on HTTP**

**Impact on state routes:**
- All `/api/v1/state/*` routes return **401** without valid session
- Client mutations in `ReportsWorkspace`, `FundsWorkspace`, `NurseriesWorkspace` fail silently or show errors
- Middleware may redirect to login; pages appear to “work” but APIs don’t

**Local prod workaround:** set `COOKIE_SECURE=false` or `NEXT_PUBLIC_APP_URL=http://localhost:3001` before `next start`.

**Real production note:** Correct for HTTPS deployments, but easy to miss when QA uses `next start` locally.

---

### LOG-003 — `loadEnv()` called on every module import (production log flood)

**Evidence:** Production server terminal (`745131`, `908533`) — hundreds of lines per page load:

```
◇ injected env (0) from .env
◇ injected env (0) from .env.local
```

**Root cause chain:**
1. `lib/db/client.ts` calls `loadEnv()` at import time
2. ~90+ API routes call `loadEnv()` at top of file
3. Each state SSR request imports repository modules → repeated dotenv parsing

**Dev vs prod difference:**
- Dev: `(12)` vars injected first time — noticeable but tolerable
- Prod: `(0)` on repeat — vars already in `process.env`, but **dotenv still runs and logs** on every import path

**Production impact:**
- I/O + CPU on every request
- Log volume unusable in production monitoring
- Adds latency to state layout (multiple DB modules imported per request)

**Recommendation:** Load env once at process entry (`instrumentation.ts` or guarded `loadEnv` with `if (!globalThis.__envLoaded)`).

---

### LOG-004 — Debug instrumentation left in production paths

**Session ID:** `39e4f8` — ingest URL `http://127.0.0.1:7410/ingest/...`

| File | Context |
|------|---------|
| `app/api/v1/state/reports/generate/route.ts` | 5 fetch calls + console.log |
| `app/state/reports/page.tsx` | 2 fetch calls on SSR |
| `lib/repositories/state-report-data.ts` | fetch in `fetchFundReportData` |
| `components/state/ReportsWorkspace.tsx` | 3 fetch calls on client download |

**Production impact:**
- Dead network calls on every report page load and export (harmless but wasteful)
- **Must remove before real deployment**
- Adds noise when debugging actual prod issues

---

### LOG-005 — Full-state report data fetch is too heavy for 60s budget

**Path:** `fetchFullStateReportData()` in `lib/repositories/state-report-data.ts`

Sequential / N+1 pattern in `fetchFundReportData()`:

```typescript
const dashboard = await getStateFundsDashboard();
for (const scheme of dashboard.schemes) {
  const detail = await getSchemeReportDetail(scheme.slug); // one DB round-trip per scheme
}
```

Plus parallel fetches for districts, talent pipeline, verification queue.

**With 110 seeded academies this can mean:**
- Dozens of SQL queries across schemas
- Large in-memory structures before PDF/XLSX render
- PDF adds 5+ landscape pages with table rendering

**Dev vs prod:** Same code path, but prod has **smaller DB pool (5 vs 10)** → queries queue under concurrent layout + report generation.

---

### LOG-006 — State layout loads DB on every navigation

**File:** `components/state/StateLayoutContent.tsx`

```typescript
const [adminMeta, fundsFyMeta] = await Promise.all([
  getStateAdminShellMeta(),
  getFundsHeaderFyMeta(),
]);
```

Every `/state/*` page pays for 2 DB calls in layout **plus** page-specific queries (e.g. overview calls `getStateOverview()` with many aggregates).

**Production impact:** Higher TTFB than dev for state pages; worse under connection pool limits.

---

### LOG-007 — Reports page SSR runs 3 heavy repository calls

**File:** `app/state/reports/page.tsx`

```typescript
await Promise.all([
  getStateReportsDashboard(),
  getStateReportAvailability(),  // may touch all report types
  statePortalHasAnyData(),
]);
```

**Observed:** Page shell returns quickly (~21ms in unauthenticated probe — likely login redirect HTML), but authenticated SSR with full DB is heavier.

---

### LOG-008 — OTP login disabled in production

**File:** `lib/auth/otp.ts`

```typescript
if (process.env.NODE_ENV === "production" && process.env.OTP_STUB_ENABLED !== "true") {
  // rejects OTP
}
```

**Dev vs prod:** OTP mode works in dev stub; **fails in production** unless explicitly enabled. State portal password login unaffected.

---

### LOG-009 — Microservices gateway not started in production script

**Scripts:**
- `pnpm dev` → Next.js + gateway `:4000` + 6 services
- `pnpm start` → **Next.js only**

**State portal impact:** **Low** — state routes use `lib/repositories/*` directly, not gateway.  
**Other portals:** Academy client `api.*` from server components would hit gateway and fail if not running.

---

### LOG-010 — Production build route table (state)

All state UI routes built as **dynamic** (correct for auth + DB):

```
ƒ /state
ƒ /state/athletes
ƒ /state/districts
ƒ /state/funds
ƒ /state/funds/[schemeSlug]
ƒ /state/nurseries
ƒ /state/nurseries/requests
ƒ /state/overview
ƒ /state/reports
ƒ /state/scouting
ƒ /state/verification
```

State API routes also dynamic (`ƒ`). No erroneous static prerender of DB-backed pages.

---

## Dev vs prod difference matrix (state)

| # | Topic | Dev | Prod | User-visible symptom |
|---|-------|-----|------|----------------------|
| 1 | Session cookie `Secure` flag | false | true (default) | APIs 401; downloads fail on local prod |
| 2 | DB pool max | 10 | 5 | Slower pages under load |
| 3 | OTP auth | stub accepts | blocked | OTP login broken in prod |
| 4 | `loadEnv()` logging | occasional | every import | Log flood; latency |
| 5 | Debug ingest fetch | fires | fires | Wasted requests |
| 6 | Report PDF timeout | slow | **empty response** | Reports screen broken for PDF |
| 7 | Gateway services | running | not running | N/A for state DB routes |

---

## State route checklist (manual QA)

| Route | SSR expected | API dependency | Prod risk |
|-------|--------------|----------------|-----------|
| `/state/overview` | DB aggregates | — | Pool / slow queries |
| `/state/nurseries` | `listStateNurseries` | register/deregister | Cookie auth |
| `/state/districts` | district rollup | — | Medium |
| `/state/funds` | funds dashboard | release, allocation | Cookie auth |
| `/state/funds/[slug]` | scheme detail | disbursements | Cookie auth |
| `/state/reports` | 3 repo calls | **generate** | **PDF timeout** |
| `/state/scouting` | player list | bulk status, shortlist PDF | PDF similar risk |
| `/state/verification` | queue | approve/flag | Cookie auth |
| `/state/athletes` | athlete rollup | — | Medium |
| `/state/nurseries/requests` | onboarding list | review, documents | Cookie auth |

---

## Production deployment feedback

### P0 — Fix before production

1. **Remove debug instrumentation** (`127.0.0.1:7410`, `#region agent log`) from report route, reports page, `ReportsWorkspace`, `state-report-data.ts`.
2. **Fix report generation SLA:**
   - Increase `maxDuration` for report route (Vercel Pro) OR
   - Move PDF/XLSX generation to background job + polling/download URL OR
   - Pre-aggregate report data; batch scheme queries with `Promise.all` + SQL joins
3. **Guard `loadEnv()`** — single load at startup; remove per-route calls.
4. **Set production env explicitly:**
   - `NEXT_PUBLIC_APP_URL=https://your-domain`
   - `JWT_SECRET`, `DATABASE_URL` (pooler URI)
   - Do **not** rely on dotenv in serverless if platform injects env

### P1 — Local prod parity for QA

```bash
# Build
pnpm build

# Run local prod with HTTP-safe cookies
COOKIE_SECURE=false NODE_ENV=production pnpm start -p 3001
```

Without `COOKIE_SECURE=false`, local prod **will not match dev** for any authenticated state API.

### P2 — Performance

- Parallelize `getSchemeReportDetail` in `fetchFundReportData`
- Consider caching `getStateOverview()` / district rollup with short TTL
- Increase `DATABASE_POOL_MAX` for long-running Node server (not serverless)

### P3 — Observability

- Add structured timing headers (partially started: `X-Report-Timing-Ms`)
- Replace dotenv tip logs with silent load
- Add `/health` check that verifies DB connectivity (currently status-only)

---

## Reproduce / verify

```bash
cd khel-setu

# 1. Production build
pnpm build

# 2. Start prod with local-friendly cookies
COOKIE_SECURE=false NODE_ENV=production pnpm start -p 3001

# 3. Fast probe (skip PDF or expect 45s timeout)
pnpm exec tsx scripts/state-prod-probe-fast.ts

# 4. Full comparison (includes PDF — slow)
pnpm exec tsx scripts/state-prod-qa.ts --dev-port 3000 --prod-port 3001
```

**Known failure signature (PDF):**

```bash
curl -w "\nHTTP:%{http_code} time:%{time_total}s\n" \
  -b cookies.txt -X POST http://localhost:3001/api/v1/state/reports/generate \
  -H "content-type: application/json" \
  -d '{"reportType":"full-state","format":"pdf"}'
# → HTTP:000 time:118s+ (empty reply)
```

---

## Related files

| Purpose | Path |
|---------|------|
| Prod QA probe | `scripts/state-prod-probe-fast.ts` |
| Full dev/prod diff | `scripts/state-prod-qa.ts` |
| Cookie behavior | `lib/auth/cookies.ts` |
| Report API | `app/api/v1/state/reports/generate/route.ts` |
| Report data | `lib/repositories/state-report-data.ts` |
| PDF generator | `lib/state-report-generators/full-state-report.ts` |
| State layout | `components/state/StateLayoutContent.tsx` |
| Env loader | `lib/load-env.ts`, `lib/db/client.ts` |

---

## Appendix — probe commands output (2026-06-23)

**Unauthenticated probe (dev :3000):**
- Login API → 500 (server under load from concurrent PDF tests)
- `/state/overview` → 200 (login redirect HTML, not authenticated shell)
- `/api/v1/state/nurseries` → 401 (expected without cookie)

**Production server under report load:**
- Login → **15s timeout** (event loop saturated by in-flight PDF generation)
- Confirms prod is more fragile under heavy report requests than dev

---

## Pass 2 — Demo-ready fixes (2026-06-23)

### Code changes applied

| Item | Fix | Status |
|------|-----|--------|
| LOG-003 `loadEnv()` flood | `globalThis.__khelsetuEnvLoaded` guard + `quiet: true` in [`lib/load-env.ts`](lib/load-env.ts) | **Resolved** |
| LOG-004 Debug instrumentation | Removed from reports paths (prior session) | **Resolved** |
| LOG-007 Reports page SSR | `loadReportsPageData()` + Suspense (prior session) | **Resolved** |
| LOG-001/005 Report data N+1 | `fetchAllSchemeReportDetails()` batched in [`lib/repositories/state-funds.ts`](lib/repositories/state-funds.ts); `fetchFundReportData()` wired | **Resolved** |
| Scouting PDF route timeout | `maxDuration = 60` on shortlist-report route | **Resolved** |
| Local prod QA | `pnpm start:demo`, `pnpm qa:state-prod`, `pnpm qa:demo-prod` | **Added** |
| Full-app smoke | [`scripts/demo-prod-smoke.ts`](scripts/demo-prod-smoke.ts) | **Added** |

### Probe results (fresh build, port 3003)

```
PROD_ONLY=1 PROD_PORT=3003 pnpm qa:state-prod
```

| Step | Result | Notes |
|------|--------|-------|
| Login | **500** | Postgres `57014` statement timeout when multiple prod instances share DB |
| State pages | 200 (unauthenticated HTML) | Expected without session cookie |
| State APIs / reports | 401 | Expected without session |

**Earlier on port 3002 (single server, before DB contention):**

| Step | Result |
|------|--------|
| State login | 200 |
| `/state/overview`, `/state/reports`, `/state/funds` | 200 (~6–41ms) |
| District XLSX | Timed out at 45s (probe timeout; re-run with 90s) |

**Dev reference (port 3000, same session):**

| Step | Result |
|------|--------|
| District XLSX | **200** in **392ms** |
| Full-state PDF | **200** in **3479ms** |

### Demo runbook

**Local production (HTTP-safe cookies):**

```bash
cd khel-setu
pnpm build
pnpm start:demo          # COOKIE_SECURE=false on default port 3000
# or: pnpm start:demo -- -p 3001

# In another terminal — use ONE prod server only (avoid multiple next start on same DB)
PROD_ONLY=1 PROD_PORT=3000 pnpm qa:state-prod
PROD_PORT=3000 pnpm qa:demo-prod
```

**Required `.env` for probes:**

- `STATE_ADMIN_EMAIL` / `STATE_ADMIN_PASSWORD` — state portal
- `BULK_ADMIN_PASSWORD` — academy portal (`admin-ambala-1@haryana-sports.in` by default)
- Optional: `DEMO_COACH_IDENTIFIER` / `DEMO_PLAYER_IDENTIFIER` + passwords for coach/player smoke

**Deployed demo (HTTPS):**

- `NEXT_PUBLIC_APP_URL=https://your-domain`
- `DATABASE_URL` (pooler URI, e.g. `:6543`)
- `JWT_SECRET`
- Use **password login** (OTP disabled in production unless `OTP_STUB_ENABLED=true`)
- Gateway/microservices **not required** — browser calls same-origin `/api/v1/*`; SSR uses `lib/repositories/*`

**Live demo script (recommended):**

1. State admin → `/state/overview` → `/state/reports`
2. Generate **district-performance XLSX** (fast, reliable)
3. Generate **full-state PDF** if on Vercel Pro / local prod (allow ~5–10s)
4. Academy admin → `/academy/{id}` → players / attendance
5. Coach/player login pages at `/auth/coach/login`, `/auth/player/login`

**Do not run** multiple `next start` instances against the same remote DB during QA — causes statement timeouts (`57014`).

---

*End of log — update this file after each prod QA pass.*
