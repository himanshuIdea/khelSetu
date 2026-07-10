# State Portal Demo — Database Seeding Instructions

End-to-end guide to seed PostgreSQL so **live repository queries** return the same numbers shown in the current demo UI (hardcoded fixtures + workspace overrides).

**Audience:** engineers running a demo/recording database once, then removing UI bypasses.

**Last aligned with working tree:** July 2026 (uncommitted demo branch).

---

## 1. Executive summary

### What the app does today (demo mode)

The state portal currently uses **two layers**:

| Layer | What it does | Remove when DB is seeded |
|-------|----------------|---------------------------|
| **Fixture files** (`lib/state-demo-*.ts`) | Canonical per-row demo numbers | Keep as seed source of truth, or delete after seed script imports them |
| **Page/API bypasses** (`TODO(demo)` comments) | Skip DB rollups; inject fixtures in RSC pages & one API route | **Revert** (see §10) |
| **Workspace hardcodes** | Overview / Verification / Athletes / Nurseries / Reports show fixed totals even when API returns other values | **Revert** (see §10) |

Until the DB is seeded **and** bypasses are removed, the UI can show demo numbers that **do not match** `pnpm db:seed:check` / SQL counts.

### Target statewide metrics (UI north star)

These are the numbers hardcoded across workspaces and/or implied by demo fixtures:

| Domain | Metric | Target | Primary source file |
|--------|--------|--------|---------------------|
| Nurseries | Registered statewide | **439** | `OverviewWorkspace`, `NurseriesWorkspace` |
| Verification | Verified / Pending / Flagged | **285 / 98 / 56** | `OverviewWorkspace`, `VerificationWorkspace` |
| Athletes | Active roster statewide | **49,882** | `OverviewWorkspace`, `AthletesWorkspace` |
| Coaches | NIS coaches | **1,465** | `OverviewWorkspace` |
| Districts | Per-district nurseries / athletes / coaches / verification | See §4 | `lib/state-demo-districts.ts` |
| Funds | Beneficiaries paid | **1,932** | `lib/state-demo-funds.ts` |
| Funds | FY allocation / disbursed | **₹577.4 Cr / ₹406.05 Cr** (see §6) | `lib/state-demo-funds.ts` |
| Funds | Pending approval | **12** | `lib/state-demo-funds.ts` |
| Funds | Paid on time | **94.2%** | `lib/state-demo-funds.ts` |
| Scouting | Prospects identified | **2,419** | `lib/state-demo-scouting.ts` |
| Scouting | Khelo India shortlisted | **185** | `lib/state-demo-scouting.ts` |
| Scouting | In state training camps | **1,198** | `lib/state-demo-scouting.ts` |
| Scouting | Reached national camp | **19%** (460 athletes) | `lib/state-demo-scouting.ts` |
| Reports | Generated this month | **122** | `ReportsWorkspace` |

> **Note on funds:** `lib/state-demo-funds.ts` header comment still says `7 Cr / 3.89 Cr`, but the **seed values in that file today** sum to **₹577.4 Cr allocated** and **₹406.05 Cr disbursed**. This document follows the **actual fixture math**, not the stale comment.

> **Note on districts:** `lib/state-demo-districts.ts` header says `439 / 49,882 / 1,465`, but row sums today are **499 / 57,763 / 1,605** (verified nursery rows sum **376**). §4 explains how to scale or fix rows before seeding.

### Gap vs default bulk seed (`pnpm db:seed`)

| Entity | Default `db:seed` (110 academies) | Demo target | Scale factor |
|--------|-----------------------------------|-------------|--------------|
| Nurseries | 110 | 439 | ×3.99 |
| Players | ~3,123 | 49,882 | ×15.97 |
| Coaches | ~1,479 | 1,465 | ×0.99 (close) |
| Verification split | 66 / 22 / 22 | 285 / 98 / 56 | custom assignment |
| Fund disbursements | 0 (catalog only) | §6 | new seed pass |
| Scouting statuses | mostly null | §7 | new seed pass |
| Report exports | 0 | 122 | insert rows |

**Conclusion:** `pnpm db:seed` alone is **not sufficient**. You need a **second demo seed pass** (recommended new script) after the bulk academy seed, or a redesigned bulk distribution.

---

## 2. Inventory — uncommitted demo-related files

### New files (untracked)

| File | Role |
|------|------|
| `lib/state-demo-districts.ts` | 22-row district rollup fixture |
| `lib/state-demo-funds.ts` | Funds dashboard + overview utilisation fixture |
| `lib/state-demo-scouting.ts` | Scouting dashboard + talent pipeline fixture |
| `e2e/state-portal-demo.spec.ts` | Playwright walkthrough for recording |
| `e2e/DEMO_SCRIPT.md` | Voice-over timing script |
| `e2e/helpers/*` | Playwright credentials/actions |
| `playwright.config.ts` | Demo test runner config |
| `scripts/run-state-demo-record.mjs` | `pnpm demo:record` entry |

### Modified files — DB bypass (`TODO(demo)`)

| File | Bypass |
|------|--------|
| `app/state/districts/page.tsx` | `STATE_DEMO_DISTRICT_ROWS` instead of `listStateDistrictRollup()` |
| `app/state/funds/page.tsx` | `STATE_DEMO_FUNDS_DASHBOARD` instead of `getStateFundsDashboard()` |
| `app/api/v1/state/funds/route.ts` | Same demo dashboard on API refresh |
| `app/state/scouting/page.tsx` | `STATE_DEMO_SCOUTING_DASHBOARD` instead of `getStateScoutingDashboard()` |
| `lib/repositories/state-aggregates.ts` | `fetchFundUtilisationSummaryFast()` returns `STATE_DEMO_FUND_UTILISATION` |

### Modified files — workspace hardcodes (still show fixed text when `hasData`)

| File | Hardcoded values |
|------|------------------|
| `components/state/OverviewWorkspace.tsx` | 439 nurseries, 49,882 athletes, 1,465 coaches, 285/98/56 verification, flagged copy |
| `components/state/NurseriesWorkspace.tsx` | subtitle `439 active nurseries` |
| `components/state/AthletesWorkspace.tsx` | subtitle `of 49,882 athletes` |
| `components/state/VerificationWorkspace.tsx` | 285 verified, 98 pending, 56 flagged |
| `components/state/ReportsWorkspace.tsx` | 122 reports generated this month |
| `components/state/ScoutingWorkspace.tsx` | stat tiles read from demo dashboard (via page bypass) |
| `components/state/funds/FundsWorkspace.tsx` | stat tiles read from demo dashboard (via page bypass) |

---

## 3. Prerequisites

### 3.1 Environment

```bash
cd khel-setu
cp .env.example .env   # if needed
```

Required variables:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `STATE_ADMIN_EMAIL` | State admin login for portal |
| `STATE_ADMIN_PASSWORD` | State admin password |
| `BULK_ADMIN_PASSWORD` | Academy admin password during bulk seed |
| `SESSION_SECRET` | Auth sessions |

### 3.2 Fresh database baseline

```bash
pnpm db:migrate          # apply all migrations through 0024+
pnpm db:seed             # identity + 110 academies + FY catalog (no disbursements)
pnpm db:seed:check       # connectivity smoke test
pnpm exec tsx scripts/audit-seed.ts   # optional completeness report
```

Confirm state admin exists:

```sql
SELECT email, platform_role FROM identity.users WHERE platform_role = 'state_admin';
```

### 3.3 Recommended: backup before demo pass

```bash
pg_dump "$DATABASE_URL" -Fc -f khelsetu-pre-demo.dump
```

---

## 4. Phase A — Nurseries & district rollup (439 total)

### 4.1 Data model mapping

| UI column | DB source |
|-----------|-----------|
| District nurseries count | `academy.academies` (non-deleted) per `district` + `platform.state_nursery_registrations` row |
| Athletes per district | `people.players` (active/on_hold) joined to academies by district |
| Coaches per district | `people.coaches` joined to academies by district |
| Verification `verified/total (%)` | Count of nurseries with `state_nursery_registrations.verification_status = 'verified'` per district |

Repositories:

- Districts list: `lib/repositories/state-districts.ts` → `listStateDistrictRollup()`
- Overview nursery count: `academyIds` from `getStateNurseryContext()`

### 4.2 Per-district target table (from `lib/state-demo-districts.ts`)

Use these counts when assigning academies/nurseries per district. **Scale nurseries** so the sum is **439** (multiply each `nurseries` by `439/499 ≈ 0.8798` and round, then fix rounding on largest districts).

| District | Nurseries | Athletes | Verified | Coaches |
|----------|----------:|---------:|---------:|--------:|
| Ambala | 20 | 2,137 | 17 | 65 |
| Bhiwani | 34 | 4,683 | 26 | 112 |
| Charkhi Dadri | 8 | 783 | 8 | 31 |
| Faridabad | 28 | 2,548 | 20 | 80 |
| Fatehabad | 15 | 1,476 | 11 | 49 |
| Gurugram | 30 | 2,674 | 22 | 86 |
| Hisar | 32 | 3,928 | 24 | 105 |
| Jhajjar | 28 | 3,462 | 21 | 90 |
| Jind | 26 | 3,164 | 20 | 84 |
| Kaithal | 23 | 2,718 | 17 | 71 |
| Karnal | 29 | 3,379 | 22 | 90 |
| Kurukshetra | 24 | 2,841 | 18 | 74 |
| Mahendragarh | 11 | 1,078 | 8 | 38 |
| Nuh | 9 | 891 | 6 | 34 |
| Palwal | 10 | 963 | 7 | 35 |
| Panchkula | 21 | 2,086 | 16 | 66 |
| Panipat | 27 | 3,247 | 20 | 85 |
| Rewari | 12 | 1,134 | 8 | 40 |
| Rohtak | 37 | 5,124 | 29 | 120 |
| Sirsa | 18 | 1,839 | 12 | 58 |
| Sonipat | 39 | 5,537 | 30 | 125 |
| Yamunanagar | 18 | 2,071 | 14 | 67 |
| **Sum (current file)** | **499** | **57,763** | **376** | **1,605** |
| **UI target** | **439** | **49,882** | **285*** | **1,465** |

\*Statewide verified nurseries for verification screens = **285**, not the sum of per-district `verifiedCount` (376). When seeding, set **285** nurseries to `verified` globally; per-district verified counts should be adjusted so each row displays `verifiedCount/nurseries` consistent with district table.

### 4.3 Implementation strategy

**Option A (recommended): extend bulk seed constants**

1. In `db/seed/bulk/constants.ts`, change:
   ```ts
   export const ACADEMIES_PER_DISTRICT = 20; // 22 × 20 = 440, trim 1 academy
   export const TOTAL_ACADEMIES = HARYANA_DISTRICTS.length * ACADEMIES_PER_DISTRICT;
   ```
2. Replace uniform 5-per-district with **weighted counts** from §4.2 (import from `lib/state-demo-districts.ts` or duplicate seed array).
3. Re-run `pnpm db:seed` on a clean DB.

**Option B: post-seed expansion script**

1. Keep 110 academies from bulk seed.
2. Add `scripts/seed-demo-nurseries.ts` that:
   - For each district, inserts additional `academy.academies` until district nursery count matches §4.2 (scaled to 439 total).
   - Calls `ensureStateNurseryRegistered(academyId, stateAdminUserId, status)`.
   - Uses `seedAcademyDemoDepth()` with **scaled** `playerCountForAcademy` / `coachCountForAcademy`.

**Verification status assignment (285 / 98 / 56)**

Across all **439** nursery registrations:

```sql
-- After seeding academies, assign statuses (pseudo):
-- 285 → verification_status = 'verified'
--  98 → verification_status = 'pending'
--  56 → verification_status = 'flagged'
```

Current bulk pattern (`verificationStatusForAcademy`: 3 verified + 1 pending + 1 flagged per 5 academies) does **not** produce 285/98/56. Replace with explicit assignment:

```ts
// Example: shuffle academy IDs, slice into three buckets
const verifiedIds = shuffled.slice(0, 285);
const pendingIds = shuffled.slice(285, 285 + 98);
const flaggedIds = shuffled.slice(285 + 98, 439);
```

For **flagged** nurseries, also insert a row via `flagStateNursery()` (see `db/seed/index.ts`).

### 4.4 Athlete & coach totals

After nurseries exist, player/coach counts must hit:

- **49,882** players statewide (scale factor ≈ `49882 / current_player_count`)
- **1,465** coaches statewide (scale factor ≈ `1465 / current_coach_count`)

Per-district targets: use §4.2 `athleteCount` × `(49882/57763)` and `coaches` × `(1465/1605)`, then distribute across academies in that district.

**Player status:** `active` or `on_hold` (required by state queries).

**Coach NIS levels:** `nis_level_1`, `nis_level_2`, `in_review` — any mix; only total count matters for district rollup.

### 4.5 Validation SQL — districts

```sql
-- Nurseries per district
SELECT a.district, COUNT(*) AS nurseries
FROM academy.academies a
JOIN platform.state_nursery_registrations r ON r.academy_id = a.id
WHERE a.deleted_at IS NULL
GROUP BY a.district
ORDER BY a.district;

-- Statewide totals
SELECT
  (SELECT COUNT(*) FROM platform.state_nursery_registrations r
   JOIN academy.academies a ON a.id = r.academy_id AND a.deleted_at IS NULL) AS nurseries,
  (SELECT COUNT(*) FROM people.players p
   JOIN academy.academies a ON a.id = p.academy_id AND a.deleted_at IS NULL
   WHERE p.status IN ('active','on_hold')) AS athletes,
  (SELECT COUNT(*) FROM people.coaches c
   JOIN academy.academies a ON a.id = c.academy_id AND a.deleted_at IS NULL) AS coaches;

-- Verification breakdown
SELECT r.verification_status, COUNT(*)
FROM platform.state_nursery_registrations r
JOIN academy.academies a ON a.id = r.academy_id AND a.deleted_at IS NULL
GROUP BY r.verification_status;
-- Expect: verified=285, pending=98, flagged=56
```

---

## 5. Phase B — Verification queue UI

Hardcoded in `VerificationWorkspace` / `OverviewWorkspace`:

| Status | Count |
|--------|------:|
| Verified | 285 |
| Pending | 98 |
| Flagged | 56 |

**DB:** `platform.state_nursery_registrations.verification_status` (+ flag notes for flagged via onboarding flags).

**Overview verification %:** computed from `getStateNurseryContext().verificationByAcademy` in `state-aggregates.ts`. Once 285/98/56 are seeded, **remove workspace hardcodes** so `verification.rate`, `verification.verified`, etc. drive the UI.

```sql
SELECT verification_status, COUNT(*)
FROM platform.state_nursery_registrations
GROUP BY 1;
```

---

## 6. Phase C — Fund utilisation (DBT)

### 6.1 Fixture → DB mapping

| UI / fixture field | DB tables / columns |
|--------------------|---------------------|
| Scheme name, color, beneficiary type | `platform.state_fund_schemes` |
| `allocatedPaise` | `state_fund_schemes.allocated_amount_paise` |
| `disbursedPaise` | `SUM(state_fund_disbursements.amount_paise)` where `status='paid'` |
| `beneficiaries` (per scheme) | `COUNT(DISTINCT player_id/coach_id/academy_id)` on paid disbursements |
| FY label `2026-27` | `platform.state_fiscal_years` |
| `pendingApproval: 12` | `COUNT(*)` disbursements `status='pending'` statewide |
| `paidOnTimeRate: 94.2` | paid before `due_date` (or within 30d if null) — see `state-funds.ts` |

### 6.2 Per-scheme seed targets (from `lib/state-demo-funds.ts`)

`CRORE_PAISE = 100_000_000` (1 Cr = 10,000,000 rupees = 100,000,000 paise).

| Scheme slug | Beneficiaries | Allocated (paise) | Disbursed (paise) | Util % |
|-------------|-------------:|------------------:|------------------:|-------:|
| `sports-scholarships` | 720 | 22,200,000,000 | 19,200,000,000 | 86% |
| `padak-lao` | 45 | 10,000,000,000 | 4,000,000,000 | 40% |
| `diet-allowance` | 380 | 14,000,000,000 | 11,000,000,000 | 79% |
| `coach-honorarium` | 312 | 2,500,000,000 | 1,480,000,000 | 59% |
| `nursery-equipment` | 385 | 9,000,000,000 | 4,900,000,000 | 54% |
| `athlete-insurance` | 90 | 40,000,000 | 25,000,000 | 63% |
| **Total** | **1,932** | **57,740,000,000** | **40,605,000,000** | **70%** |

Displayed as **₹577.4 Cr** allocated / **₹406.05 Cr** disbursed via `formatStateFundAmount()`.

### 6.3 Seed procedure

1. Ensure FY catalog:
   ```bash
   pnpm exec tsx scripts/seed-state-funds.ts
   ```
2. Set FY total allocation:
   ```sql
   UPDATE platform.state_fiscal_years
   SET total_allocated_amount_paise = 57740000000, is_active = true
   WHERE label = '2026-27';
   ```
3. Update each scheme allocation:
   ```sql
   UPDATE platform.state_fund_schemes s
   SET allocated_amount_paise = :allocatedPaise
   FROM platform.state_fiscal_years fy
   WHERE s.fiscal_year_id = fy.id AND fy.label = '2026-27' AND s.slug = :slug;
   ```
4. Insert **paid** disbursements per scheme:
   - Pick real `player_id`, `coach_id`, or `academy_id` from seeded rosters matching `beneficiary_type`.
   - Split `disbursedPaise` across `beneficiaries` rows (uneven amounts OK; sum must match).
   - Set `status = 'paid'`, `paid_at = now()`, `created_by_user_id` = state admin UUID.
5. Insert **12 pending** disbursements (any scheme) for `pendingApproval`.
6. For ~94.2% on-time: ensure ~94.2% of paid rows have `paid_at <= due_date` (or `due_date IS NULL` and paid within 30 days of `created_at`).

**Suggested new script:** `scripts/seed-demo-funds.ts` importing `DEMO_FUND_SCHEME_SEEDS` from `lib/state-demo-funds.ts` (export seeds from that file).

### 6.4 Validation SQL — funds

```sql
SELECT s.slug,
       s.allocated_amount_paise,
       COALESCE(SUM(d.amount_paise) FILTER (WHERE d.status='paid'),0) AS paid_paise,
       COUNT(DISTINCT COALESCE(d.player_id::text, d.coach_id::text, d.academy_id::text))
         FILTER (WHERE d.status='paid') AS beneficiaries
FROM platform.state_fund_schemes s
JOIN platform.state_fiscal_years fy ON fy.id = s.fiscal_year_id AND fy.is_active
LEFT JOIN platform.state_fund_disbursements d ON d.scheme_id = s.id
GROUP BY s.id, s.slug, s.allocated_amount_paise
ORDER BY s.sort_order;

SELECT COUNT(*) FILTER (WHERE status='pending') AS pending FROM platform.state_fund_disbursements;
```

Compare output to §6.2.

---

## 7. Phase D — Scouting & talent pipeline

### 7.1 Fixture → DB mapping

| Dashboard field | DB |
|-----------------|-----|
| `prospectsIdentified` | `COUNT(players)` where `scouting_status IS NOT NULL` |
| `shortlistedCount` | `scouting_status = 'khelo_india'` |
| `inCampsCount` | `scouting_status = 'shortlisted_for_states'` |
| `nationalCampRate` | `round(nationals / identified * 100)` |
| Pipeline bars | same counts as above + `in_trials` |
| Age groups | players with scouting status, grouped by `batches.name` ∈ Sub-junior / Junior / Senior |

Enum values: `khelo_india`, `shortlisted_for_nationals`, `shortlisted_for_states`, `in_trials`, `not_selected`, `watchlist`.

### 7.2 Target counts (from `lib/state-demo-scouting.ts`)

| Bucket | Count |
|--------|------:|
| Any scouting status (identified) | 2,419 |
| `khelo_india` | 185 |
| `shortlisted_for_states` (state camps) | 1,198 |
| `shortlisted_for_nationals` (national camp) | 460 |
| `in_trials` | 576 |
| Remaining identified | 2,419 − (185+1198+460+576) = **0** (all identified players assigned) |

**Age groups** (players with non-null scouting status):

| Batch | Count |
|-------|------:|
| Sub-junior | 1,024 |
| Junior | 876 |
| Senior | 519 |
| **Sum** | **2,419** |

### 7.3 Seed procedure

1. Select 2,419 players statewide (prefer high `rating` for scouting list UI).
2. Assign `scouting_status` per §7.2 buckets (use `UPDATE people.players SET scouting_status = ..., scouting_status_set_at = now()`).
3. Ensure batch distribution: when picking players for each status bucket, enforce Sub-junior/Junior/Senior counts **within the 2,419** (may require setting `batch_id` to correct batch rows).
4. Leave remaining ~47,463 players with `scouting_status IS NULL` so statewide athlete total stays **49,882**.

**Suggested script:** `scripts/seed-demo-scouting.ts`.

### 7.4 Validation SQL — scouting

```sql
SELECT scouting_status, COUNT(*)
FROM people.players
WHERE scouting_status IS NOT NULL
GROUP BY 1;

SELECT b.name, COUNT(*)
FROM people.players p
JOIN academy.batches b ON b.id = p.batch_id
WHERE p.scouting_status IS NOT NULL
  AND b.name IN ('Sub-junior','Junior','Senior')
GROUP BY b.name;
```

---

## 8. Phase E — Reports (122 exports this month)

Hardcoded in `ReportsWorkspace`: **122** reports generated this month.

**DB:** `platform.state_report_exports`

```sql
INSERT INTO platform.state_report_exports (report_type, format, generated_by_user_id, generated_at)
SELECT
  (ARRAY['district','funds','talent','verification','full-state'])[1 + (i % 5)],
  (ARRAY['xlsx','pdf'])[1 + (i % 2)],
  (SELECT id FROM identity.users WHERE platform_role = 'state_admin' LIMIT 1),
  date_trunc('month', now()) + (i || ' hours')::interval
FROM generate_series(1, 122) AS i;
```

Validate:

```sql
SELECT COUNT(*) FROM platform.state_report_exports
WHERE generated_at >= date_trunc('month', now());
```

---

## 9. Recommended implementation plan (new scripts)

Create a single orchestrator:

```bash
pnpm exec tsx scripts/seed-state-demo.ts
```

Suggested order inside `scripts/seed-state-demo.ts`:

1. `assertStateAdminUserId()` from `db/seed/bulk/admin-credentials.ts`
2. `seedDemoNurseriesAndRosters()` — Phase A (imports `STATE_DEMO_DISTRICT_ROWS` or scaled seeds)
3. `seedDemoVerificationStatuses()` — 285/98/56
4. `seedDemoFunds()` — Phase C (import seeds from `state-demo-funds.ts`; export internal seed array)
5. `seedDemoScouting()` — Phase D
6. `seedDemoReportExports()` — Phase E
7. Print validation summary (run SQL from §4.5, §6.4, §7.4, §8)

**Refactor fixtures for import:**

```ts
// lib/state-demo-districts.ts — also export:
export { DEMO_DISTRICT_SEEDS };

// lib/state-demo-funds.ts — also export:
export { DEMO_FUND_SCHEME_SEEDS, CRORE_PAISE };

// lib/state-demo-scouting.ts — export bucket constants
```

---

## 10. Removing UI bypasses (after DB validates)

When SQL counts match §1 targets, revert demo wiring so repositories drive the UI again.

### 10.1 Restore pages / API

| File | Restore |
|------|---------|
| `app/state/districts/page.tsx` | `listStateDistrictRollup()` |
| `app/state/funds/page.tsx` | `getStateFundsDashboard()` |
| `app/api/v1/state/funds/route.ts` | `getStateFundsDashboard()` |
| `app/state/scouting/page.tsx` | `getStateScoutingDashboard()` |
| `lib/repositories/state-aggregates.ts` | Remove early `return STATE_DEMO_FUND_UTILISATION` |

### 10.2 Restore workspace live values

| File | Restore |
|------|---------|
| `OverviewWorkspace.tsx` | `summary.nurseryCount`, `summary.athleteCount`, `summary.coachCount`, `verification.*` |
| `NurseriesWorkspace.tsx` | `nurseries.length` in subtitle |
| `AthletesWorkspace.tsx` | `total` in subtitle |
| `VerificationWorkspace.tsx` | `breakdown.*` |
| `ReportsWorkspace.tsx` | `dashboard.generatedThisMonth` |

### 10.3 Optional cleanup

- Delete `lib/state-demo-*.ts` **only if** seed script duplicates their data elsewhere.
- Keep `e2e/` for regression recording.

---

## 11. End-to-end runbook (checklist)

```text
[ ] 1. pg_dump backup
[ ] 2. pnpm db:migrate
[ ] 3. pnpm db:seed  (base 110 academies + identity)
[ ] 4. pnpm exec tsx scripts/seed-state-demo.ts  (TO BE IMPLEMENTED — phases A–E above)
[ ] 5. Run validation SQL (§4.5, §6.4, §7.4, §8)
[ ] 6. Login as state admin → spot-check:
        /state/overview
        /state/districts
        /state/nurseries
        /state/athletes
        /state/verification
        /state/funds
        /state/scouting
        /state/reports
[ ] 7. Revert §10 bypasses
[ ] 8. Re-spot-check same routes (now live data)
[ ] 9. pnpm demo:record:test (optional Playwright pass)
```

---

## 12. Repository reference — what each screen reads

| Screen | Repository / API | Key tables |
|--------|------------------|------------|
| Overview | `GET /api/v1/state/overview` → `getCachedStateOverview()` | academies, players, coaches, funds, verification map |
| Districts | `listStateDistrictRollup()` | academies, players, coaches, nursery registrations |
| Nurseries | `listStateNurseries()` | academies + registrations |
| Athletes | `listStateAthletes()` | players |
| Verification | onboarding + nursery queue repos | registrations, onboarding requests |
| Funds | `getStateFundsDashboard()` | fiscal years, schemes, disbursements |
| Scouting | `getStateScoutingDashboard()` + client prospect list | players.scouting_status, batches |
| Reports | `getStateReportsDashboard()` | state_report_exports |

---

## 13. Known inconsistencies to resolve before production

1. **District fixture sums ≠ UI headers** (499 vs 439 nurseries; 57,763 vs 49,882 athletes). Fix `lib/state-demo-districts.ts` **or** scale during seed.
2. **Funds file comment** says 7 Cr / 3.89 Cr but values are 577.4 / 406.05 Cr — update comment or values.
3. **Overview hardcodes** still mask live API even after page-level bypasses are removed — must revert workspace changes in §10.2.
4. **Default bulk seed** (`ACADEMIES_PER_DISTRICT = 5`) cannot reach 439 nurseries without structural change.
5. **Scouting prospect list** is still fetched live from API while dashboard is fixture-bypassed — seeding Phase D aligns dashboard; prospect table uses rating filters independently.

---

## 14. Quick reference — paise / crore math

```text
1 rupee     = 100 paise
1 Cr rupee  = 10,000,000 rupees = 1,000,000,000 paise
CRORE_PAISE in state-demo-funds.ts = 100_000_000 paise = 0.01 Cr rupees

formatStateFundAmount(paise):
  >= 10 lakh rupees (1,000,000 rupees) → crore display
  >= 1 lakh rupees → lakh display (₹XL)
```

---

## 15. Related docs

- `SEED_AUDIT.md` — bulk seed completeness audit
- `e2e/DEMO_SCRIPT.md` — recording walkthrough
- `lib/state-fund-schemes.ts` — canonical scheme slugs / colors
- `db/seed/index.ts` — current bulk seed entrypoint
- `scripts/seed-state-funds.ts` — FY catalog only (no disbursements)

---

*Generated to mirror the uncommitted demo hardcoding worktree. Update this file whenever `lib/state-demo-*.ts` or workspace overrides change.*
