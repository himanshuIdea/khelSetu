# Vercel Demo Production — Issue Registry & Dev/Prod Analysis

**Created:** 2026-06-24  
**Scope:** State portal on Vercel (`khel-setu-nu.vercel.app`) — sign-in stuck, routes not loading, fix/regress cycles  
**Goal:** Demo reliability only (not large-scale perf or security hardening)  
**Related:** [`STATE_PROD_QA.log.md`](STATE_PROD_QA.log.md) (local `next start` QA)

---

## Executive summary

The state portal on Vercel fails in **two independent ways** that look similar in the browser (infinite loading / stuck on login):

| Symptom | Typical Vercel log | Root layer |
|---------|-------------------|------------|
| **Stuck on `/auth/state/login`** after submit | Middleware 200 on `/state` missing; or redirect loop | Auth / cookie / JWT |
| **Stuck on loading skeleton** on `/state/*` | `Execution Duration 1m / 1m`, Status 0; External API: `Runtime Cache` | SSR timeout / cache |

**Why fixes keep breaking each other:** each patch targets one layer (cache, login transport, cookies) without a single stable auth + SSR contract. A fix for SSR (remove `unstable_cache`) can ship alongside a login change (server action) that reintroduces cookie timing issues on Vercel.

**Demo principle:** one auth path (`POST /api/v1/auth/login` + full-page redirect), no `unstable_cache` on `force-dynamic` routes, password login only, avoid full-state PDF on Hobby tier.

---

## Timeline — regression whiplash (2026-06-23 → 06-24)

| Date | Commit / change | Intended fix | Observed side effect |
|------|-----------------|--------------|----------------------|
| 06-23 | `040d935` — `completeAuthRedirect`, cookie `resolveCookieSecure`, state Suspense layout | Login cookie applied before middleware on **client fetch + redirect** | Local prod still needs `COOKIE_SECURE=false` on HTTP |
| 06-23 | Pass 2 in `STATE_PROD_QA.log.md` — batch report queries, `loadEnv` guard, remove debug ingest | Faster reports, less log noise | Does not address Vercel Runtime Cache hang |
| 06-24 | `1d3d396` — remove `unstable_cache` from `state-portal-cache.ts` | State routes stop hitting 60s Runtime Cache timeout | **State pages load** on Vercel again |
| 06-24 | `69a9046` — server-action login (`portalLoginAction`), `session-cookie.ts`, `VERCEL → secure: true` | Fix “stuck on login” after cache fix | **State portal broken again** — server action + `redirect()` vs middleware cookie read |

**Pattern:** Treat auth transport and SSR caching as **separate stability contracts**. Changing both in one deploy without Vercel smoke test causes “fixed A, broke B.”

---

## Request flow maps

### A. State login (current — server action)

```
Browser /auth/state/login
  → form action=portalLoginAction (useActionState)
  → Node server action: loginWithIdentifier → cookies().set → redirect("/state")
  → Browser follows redirect
  → Edge middleware: verify JWT from cookie → allow/deny /state
  → Node RSC: StateLayoutContent → getStateAdminShellMeta → render shell
```

**Failure points:**

1. Cookie from server action not visible to **Edge middleware** on next request (timing / RSC navigation).
2. JWT missing `platformRole: "state_admin"` → middleware redirects to login while login page `redirectIfAuthenticated` (DB profile) sends user back to `/state` → **loop**.
3. `JWT_SECRET` missing on Edge → verify returns null → always login.

### B. State login (previous — API + completeAuthRedirect)

```
Browser → fetch POST /api/v1/auth/login (credentials: include)
  → Route handler: Set-Cookie on JSON response
  → completeAuthRedirect(redirectTo) → window.location.assign("/state")
  → Edge middleware → Node RSC (same as above)
```

**Documented in** `lib/auth/complete-auth-redirect.ts` as the fix for Set-Cookie + middleware race. **Still used by** signup and change-password; **not used by** portal login after `69a9046`.

### C. State page SSR (after auth passes)

```
GET /state/nurseries (_rsc= soft nav or full load)
  → middleware 200
  → app/state/layout.tsx (force-dynamic, maxDuration=60)
    → Suspense → StateLayoutContent → getStateAdminShellMeta (1 DB query)
    → Suspense → page → listStateNurseries / etc.
      → getStateNurseryContext → cacheStateNurseryVerification (in-memory TTL)
      → multiple cross-academy DB queries (pool max=1 on Vercel)
```

**Failure points:**

1. Total SSR > 60s → Status 0, skeleton forever (`app/state/layout.tsx` `maxDuration = 60`).
2. `unstable_cache` on dynamic routes → Runtime Cache hang until 60s (**mitigated** by in-memory cache).
3. Remote DB latency (Mumbai `bom1` → DB region) × serial queries on one connection.

---

## Issue registry (LOG-VERCEL-*)

### LOG-VERCEL-001 — State routes timeout (Runtime Cache)

| Field | Value |
|-------|-------|
| **Status** | Mitigated (in-memory cache) — monitor on redeploy |
| **Symptom** | Loading skeleton forever; Vercel Status 0; `Execution 1m/1m` |
| **Log signature** | External APIs: `GET Using cache Runtime Cache` |
| **Root cause** | `unstable_cache` inside `force-dynamic` state routes blocked on Vercel incremental cache |
| **Fix applied** | `lib/repositories/state-portal-cache.ts` — module TTL slots, no `unstable_cache` |
| **Residual risk** | Per-instance cache; cold starts always hit DB; stale nursery map up to 30s |
| **Files** | `state-portal-cache.ts`, `state-nursery-helpers.ts`, `state-funds.ts`, `app/state/layout.tsx` |

### LOG-VERCEL-002 — Login stuck (server action vs middleware)

| Field | Value |
|-------|-------|
| **Status** | **Open** — introduced `69a9046` |
| **Symptom** | Submit login → stays on `/auth/state/login` or brief flash then back |
| **Log signature** | Login API may not be called at all (server action); middleware 302 to login on `/state` |
| **Root cause** | Portal login moved to `portalLoginAction` + `useActionState`; inconsistent with proven `completeAuthRedirect` path used elsewhere |
| **Recommended fix** | Revert portal login to `api.auth.login` + `completeAuthRedirect` (P0) |
| **Files** | `PortalLoginForm.tsx`, `portal-login-action.ts`, `session-cookie.ts`, `complete-auth-redirect.ts` |

### LOG-VERCEL-003 — Middleware ↔ login page redirect loop

| Field | Value |
|-------|-------|
| **Status** | Latent (shows when JWT role missing) |
| **Symptom** | Bounce between `/auth/state/login` and `/state` |
| **Root cause** | Middleware uses JWT `platformRole`; `redirectIfAuthenticated` uses DB `getAuthProfile().platformRole` |
| **Trigger** | User in DB has `state_admin` but JWT signed without `platformRole`, or verify strips unknown roles |
| **Files** | `middleware.ts`, `lib/auth/jwt.ts`, `lib/auth/redirect.ts`, `app/auth/state/login/page.tsx` |

### LOG-VERCEL-004 — Production DB missing state admin

| Field | Value |
|-------|-------|
| **Status** | Check on every new Vercel DB |
| **Symptom** | Valid-looking login → redirect to academy/onboarding or access denied |
| **Root cause** | Seed not run on production Supabase; `STATE_ADMIN_EMAIL` / `STATE_ADMIN_PASSWORD` only used at seed time |
| **Verify** | `users.platform_role = 'state_admin'` for demo account |
| **Files** | `db/seed/identity.ts`, `db/schema/identity/index.ts` |

### LOG-VERCEL-005 — JWT_SECRET missing or mismatched

| Field | Value |
|-------|-------|
| **Status** | Env checklist item |
| **Symptom** | Login 500 OR cookie set but middleware never sees session |
| **Root cause** | `JWT_SECRET` unset in Vercel env; preview vs production different secrets |
| **Files** | `lib/auth/jwt.ts`, Vercel project settings |

### LOG-VERCEL-006 — DATABASE_URL / pooler misconfiguration

| Field | Value |
|-------|-------|
| **Status** | Env checklist item |
| **Symptom** | Slow SSR, 60s timeout, intermittent 500 |
| **Root cause** | Direct `:5432` on serverless exhausts connections; wrong region latency |
| **Correct** | Pooler `:6543`, `?pgbouncer=true`, `prepare: false` (already in `lib/db/client.ts`) |
| **Files** | `lib/db/client.ts` |

### LOG-VERCEL-007 — OTP login disabled in production

| Field | Value |
|-------|-------|
| **Status** | By design |
| **Symptom** | OTP mode always fails on Vercel |
| **Root cause** | `lib/auth/otp.ts` rejects OTP when `NODE_ENV=production` unless `OTP_STUB_ENABLED=true` |
| **Demo rule** | Use **password login only** on demo |

### LOG-VERCEL-008 — Report PDF / full-state timeout

| Field | Value |
|-------|-------|
| **Status** | Known limitation |
| **Symptom** | Reports spinner forever; HTTP 000 locally after 118s+ |
| **Root cause** | `fetchFullStateReportData()` still **sequential** (4 domain fetches); PDF render heavy; `maxDuration=60` |
| **Demo rule** | Demo **district-performance XLSX** only unless Pro plan + time budget |
| **Files** | `state-report-data.ts`, `app/api/v1/state/reports/generate/route.ts`, `lib/state-report-generators/` |

### LOG-VERCEL-009 — Local prod cookie mismatch (not Vercel HTTPS)

| Field | Value |
|-------|-------|
| **Status** | Documented |
| **Symptom** | `next start` locally: pages load, APIs 401 |
| **Root cause** | `Secure` cookie on `http://localhost` |
| **Workaround** | `pnpm start:demo` (`COOKIE_SECURE=false`) |
| **Files** | `lib/auth/cookies.ts`, `package.json` |

### LOG-VERCEL-010 — Academy server paths vs gateway (out of scope for state UI)

| Field | Value |
|-------|-------|
| **Status** | Latent for academy portal on Vercel |
| **Symptom** | Academy SSR calling gateway fails |
| **Root cause** | `lib/api/http.ts` uses `API_GATEWAY_URL` (default `localhost:4000`) on server |
| **State impact** | **None** for state SSR (uses `lib/repositories/*` directly) |
| **Env trap** | `API_GATEWAY_URL=http://localhost:4000` on Vercel breaks academy, not state pages |

### LOG-VERCEL-011 — Double auth gate on every state navigation

| Field | Value |
|-------|-------|
| **Status** | Design debt |
| **Symptom** | Extra latency; confusing redirect source |
| **Root cause** | Middleware (Edge JWT) + `getStateAdminShellMeta` (Node JWT + DB name lookup) |
| **Files** | `middleware.ts`, `require-state-access.ts`, `StateLayoutContent.tsx` |

### LOG-VERCEL-012 — `unstable_cache` still on academy paths

| Field | Value |
|-------|-------|
| **Status** | Watch item |
| **Symptom** | Academy meta 500 in microservice; potential Vercel hang if used on dynamic academy routes |
| **Root cause** | `lib/repositories/academy.ts` wraps `getAcademyMeta` with `unstable_cache` |
| **State impact** | None today; same anti-pattern as state pre-fix |

---

## Dev vs prod divergence matrix

| # | Topic | `next dev` | Vercel production | Demo impact |
|---|-------|------------|-------------------|-------------|
| 1 | Process model | Long-lived Node, warm pool | Cold/warm serverless, 60s cap | Timeouts only on prod |
| 2 | DB pool max | 10 | **1** | Serial queries, higher TTFB |
| 3 | Session cookie Secure | false | true (`VERCEL` env) | Local `next start` needs `start:demo` |
| 4 | OTP | stub works | blocked | Password only on demo |
| 5 | Gateway services | `pnpm dev` starts `:4000` | Not running | State OK; academy server `api.*` broken |
| 6 | Next cache | Dev incremental cache tolerant | Runtime Cache hang with `unstable_cache` + dynamic | Fixed for state nursery context |
| 7 | Auth login path | Server action may work locally | Cookie/middleware race | Use API + full redirect |
| 8 | Middleware runtime | Edge | Edge | Same JWT verify path |
| 9 | Report PDF | ~3.5s dev QA | 60s+ timeout risk | Avoid full-state PDF in live demo |
| 10 | Env source | `.env` + `.env.local` | Vercel dashboard only | Missing seed vars → no state admin |
| 11 | Multi-instance QA | N/A | Multiple deployments share one DB | Postgres `57014` statement timeout |
| 12 | Build | `pnpm build` success ≠ runtime OK | Must smoke-test auth + one state route after deploy | **Always smoke after deploy** |

---

## Vercel environment checklist

Set in **Production** (and Preview if used for demos):

| Variable | Required | Notes |
|----------|----------|-------|
| `JWT_SECRET` | **Yes** | Long random string; same across redeploys |
| `DATABASE_URL` | **Yes** | Supabase **pooler** URI (`:6543`, transaction mode) |
| `STATE_ADMIN_EMAIL` | Seed / ops | Not read at runtime for login — user must exist in DB |
| `STATE_ADMIN_PASSWORD` | Seed / ops | Run `pnpm db:setup` against prod DB once |
| `NEXT_PUBLIC_APP_URL` | Recommended | `https://khel-setu-nu.vercel.app` (your canonical HTTPS origin) |
| `COOKIE_SECURE` | Omit on Vercel | Code forces secure when `VERCEL` is set |
| `OTP_STUB_ENABLED` | Omit | Use password login for demo |
| `API_GATEWAY_URL` | **Remove if set to localhost** | Breaks academy server paths only |
| `DATABASE_POOL_MAX` | Omit | Default 1 on Vercel is intentional for pooler |

**After every deploy — 3-step smoke (manual):**

1. `/auth/state/login` → password login → lands on `/state/overview` (not back to login).
2. `/state/nurseries` → list renders within ~10s (not 60s skeleton).
3. `/state/reports` → generate **district-performance XLSX** (not full-state PDF).

---

## File risk registry

### P0 — Auth stability (login stuck)

| File | Risk |
|------|------|
| `components/auth/PortalLoginForm.tsx` | Server action login; diverges from signup/change-password |
| `lib/auth/portal-login-action.ts` | New path; untested vs Vercel Edge middleware |
| `lib/auth/complete-auth-redirect.ts` | Proven pattern; **not used by portal login** |
| `lib/auth/session-cookie.ts` | Dual cookie path with API route |
| `lib/auth/cookies.ts` | Secure flag logic; `VERCEL` override |
| `lib/auth/jwt.ts` | Silent verify failure; minimal platformRole in token |
| `middleware.ts` | State gate on JWT only |
| `lib/auth/redirect.ts` | DB-based `redirectIfAuthenticated` vs JWT middleware |
| `app/auth/state/login/page.tsx` | Calls `redirectIfAuthenticated` |

### P0 — State SSR stability (loading forever)

| File | Risk |
|------|------|
| `app/state/layout.tsx` | `force-dynamic`, `maxDuration=60` on entire subtree |
| `lib/repositories/state-portal-cache.ts` | In-memory TTL; must never reintroduce `unstable_cache` |
| `lib/repositories/state-nursery-helpers.ts` | Called on every state page |
| `lib/repositories/state-aggregates.ts` | Heavy overview aggregates |
| `lib/db/client.ts` | Pool max 1 on Vercel |

### P1 — Demo feature reliability

| File | Risk |
|------|------|
| `lib/repositories/state-report-data.ts` | Sequential `fetchFullStateReportData` |
| `app/api/v1/state/reports/generate/route.ts` | PDF 60s cap |
| `app/state/reports/page.tsx` | Heavy SSR loader |
| `lib/repositories/state-funds.ts` | Large dashboard queries |

### P2 — Dev/prod parity tooling

| File | Purpose |
|------|---------|
| `scripts/state-prod-probe-fast.ts` | Fast prod probe |
| `scripts/demo-prod-smoke.ts` | Full-app smoke |
| `scripts/time-state-queries.ts` | Local query timing |
| `STATE_PROD_QA.log.md` | Local prod evidence |
| `package.json` | `start:demo`, `qa:state-prod`, `qa:demo-prod` |

---

## Demo reliability rules (prevent “zero-day” surprises)

1. **One login transport for all portals** — `POST /api/v1/auth/login` + `completeAuthRedirect`. Do not mix server actions for login until Vercel-smoke proven.
2. **Never add `unstable_cache` to `force-dynamic` state read paths** — use React `cache()` + short in-memory TTL only.
3. **Password login only** on Vercel demo — no OTP unless `OTP_STUB_ENABLED=true`.
4. **Smoke test after every deploy** — login + one state list page + one XLSX report.
5. **One prod DB, one `next start` instance** during local prod QA — avoids `57014` timeouts.
6. **Avoid full-state PDF** on Hobby / under time pressure — use district XLSX.
7. **Keep env minimal** — no `localhost` URLs in Vercel env vars.
8. **Verify state admin row in prod DB** before external demo — credentials alone are insufficient.
9. **Do not “fix” login and SSR in the same commit** without testing both on Vercel preview.
10. **Build success ≠ runtime success** — Vercel logs: watch middleware 200 + function duration, not just build pass.

---

## Prioritized fix backlog (demo scope)

| Priority | Item | Effort | Stabilizes |
|----------|------|--------|------------|
| **P0** | Revert portal login to API + `completeAuthRedirect` | Small | LOG-VERCEL-002 |
| **P0** | Vercel post-deploy smoke script (login + nurseries) | Small | Regression detection |
| **P0** | Document + verify prod DB seed for state admin | Ops | LOG-VERCEL-004 |
| **P1** | `Promise.all` in `fetchFullStateReportData()` | Small | LOG-VERCEL-008 |
| **P1** | Stream overview sections with nested Suspense | Medium | Layout timeout margin |
| **P1** | Align middleware + layout auth (single source) | Medium | LOG-VERCEL-003, 011 |
| **P2** | Remove redundant `loadEnv()` imports from API routes | Low | Noise |
| **P2** | Split `getAcademyMeta` cache (academy microservice vs Next) | Medium | LOG-VERCEL-012 |

---

## Vercel log interpretation cheat sheet

| Log field | Meaning | Action |
|-----------|---------|--------|
| Middleware **200**, page **Status 0** | Auth passed; SSR died or timed out | Check function duration, DB, cache |
| **Execution 1m/1m** | Hit `maxDuration=60` | Reduce SSR queries or raise cap (Pro) |
| **Runtime Cache** in External APIs | `unstable_cache` path — do not reintroduce on state | Confirm `state-portal-cache.ts` deployed |
| Middleware **302** to `/auth/state/login` | No session or wrong JWT role | Cookie / JWT_SECRET / platformRole |
| Login never hits `/api/v1/auth/login` | Server action path active | See LOG-VERCEL-002 |
| **Fluid 299 MB** | Function ran on Fluid compute | Normal for heavy SSR |

---

## Architecture decisions to freeze (demo contract)

Until after a stable demo, **do not change**:

1. **State data layer** — direct `lib/repositories/*` imports on RSC pages (no gateway).
2. **State nursery context cache** — in-memory TTL in `state-portal-cache.ts` only.
3. **Portal login** — should use API + full-page redirect (target state; currently violated).
4. **State layout** — `Suspense` + `StateLayoutContent` + per-page `loading.tsx`.
5. **Session cookie name** — `khelsetu_session`, httpOnly, SameSite=Lax, path=/.

---

## Local prod parity commands

```bash
cd khel-setu
pnpm build
pnpm start:demo                    # HTTP-safe cookies locally

# One terminal only — avoid DB contention
PROD_ONLY=1 PROD_PORT=3000 pnpm qa:state-prod
PROD_PORT=3000 pnpm qa:demo-prod
```

Required `.env` for probes: `STATE_ADMIN_EMAIL`, `STATE_ADMIN_PASSWORD`, `JWT_SECRET`, `DATABASE_URL`.

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| 2026-06-24 | Codebase audit | Initial registry after Vercel login + SSR regression cycle |

---

*Update this file after each Vercel deploy smoke test. Link new evidence from Vercel dashboard (request ID, duration, status) as new LOG-VERCEL-* entries.*
