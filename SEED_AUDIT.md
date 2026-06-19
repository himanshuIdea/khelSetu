# Database Seed & Ingestion Audit

**Date:** June 18, 2026  
**Verdict:** **PARTIAL — not successful end-to-end**

Bulk seed and per-academy data ingestion **work correctly for academies that were seeded**, but the run **did not complete**. Only **20 of 110** planned academies were ingested (~18%). Admin credential provisioning and CSV export **did not finish**.

---

## Quick verdict

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Migrations / schemas | 9 schemas | 9 schemas | Pass |
| DB connectivity | OK | OK (~285ms latency) | Pass |
| Academies | **110** (22 districts × 5) | **25** (20 bulk + 5 legacy) | **Fail** |
| State nursery registrations | **110** | **20** | **Fail** |
| Academy admin users + memberships | **110** | **5** memberships | **Fail** |
| Admin credentials CSV | `db/seed/output/*.csv` | **Not created** | **Fail** |
| Global sports catalog | 12 sports | **15** in DB | Pass |
| Per-academy depth (sample `ambala-1`) | 10 coaches, 20 players | 10 coaches, 20 players | Pass |
| State admin user | Present | Present (`state_admin`) | Pass |

---

## What succeeded

### 1. Database migration & connectivity
`pnpm db:check` connects successfully. All 9 schemas exist (`identity`, `academy`, `people`, `operations`, `competitions`, `inventory`, `payroll`, `training`, `platform`).

### 2. Per-academy ingestion (where seed ran)
For fully seeded bulk academies, nested data is present and matches spec:

**Sample: `ambala-1` (Ambala Wrestling Sports Academy)**

| Entity | Count | Expected |
|--------|------:|---------:|
| Coaches | 10 | 10 |
| Players | 20 | 20 |
| Batches | 12 | 12 (4 sports × 3 batch names) |
| Teams | 12 | varies |

Global totals from partial seed still show meaningful depth:

| Table | Count |
|-------|------:|
| Coaches | 207 |
| Players | 405 |
| Batches | 348 |
| Teams | 146 |
| Tournaments | 37 |
| Inventory items | 224 |
| Staff | 157 |
| Training sessions | 145 |
| Drill posts | 35 |

### 3. Bulk districts completed (first 4 of 22)

These district sets are **fully seeded** (5 academies each):

- Ambala (`ambala-1` … `ambala-5`)
- Bhiwani (`bhiwani-1` … `bhiwani-5`)
- Charkhi Dadri (`charkhi-dadri-1` … `charkhi-dadri-5`)
- Faridabad (`faridabad-1` … `faridabad-5`)

Nursery registrations: **20** — all `verified` — matching the 20 bulk academies above.

### 4. Identity
- State admin user exists with `platform_role = state_admin`
- `STATE_ADMIN_EMAIL` / `STATE_ADMIN_PASSWORD` are set in `.env`

---

## What failed or is incomplete

### 1. Bulk seed stopped after academy 20 of 110

The seed loop in `db/seed/index.ts` processes 110 academy specs. Runtime counts show ingestion **stopped after Faridabad** (district index 4). The next district (**Fatehabad**) and remaining **18 districts** were never seeded.

**14 districts have zero academies**, including: Fatehabad, Gurugram, Hisar, Jind, Karnal, Kurukshetra, Mahendragarh, Nuh, Palwal, Panipat, Rewari, Rohtak, Sirsa, and others.

### 2. Legacy academies mixed with bulk data

Five **pre-bulk** academies remain in the database alongside bulk slugs:

- `dronacharya`
- `maliksports`
- `sherawatacademy`
- `taudevilal`
- `prime-eagle-academy`

These inflate the academy count to **25** but are **not** part of the 110-academy bulk plan. They explain odd district counts (e.g. Faridabad showing 6 academies — 5 bulk + legacy overlap).

### 3. Academy admin provisioning never completed

`seedAllAcademyAdmins()` runs **after** all 110 academies are seeded and writes `db/seed/output/admin-credentials.csv`.

| Signal | Evidence |
|--------|----------|
| Admin memberships | Only **5** (`role = admin`) vs 25 academies |
| Output CSV | `db/seed/output/` **does not exist** |
| `BULK_ADMIN_PASSWORD` | **Not set** in `.env` today |

The seed **cannot** complete the admin step without `BULK_ADMIN_PASSWORD` (see `db/seed/bulk/admin-credentials.ts`). Either the run was interrupted before this step, or it would fail when reaching it.

### 4. Nursery registrations incomplete

Only **20 / 110** `platform.state_nursery_registrations` rows — aligned with the 20 bulk academies that finished, not the full state catalog.

---

## Environment checklist

| Variable | Status | Required for |
|----------|--------|--------------|
| `DATABASE_URL` | Set | All DB ops |
| `STATE_ADMIN_EMAIL` | Set | Identity + nursery registration |
| `STATE_ADMIN_PASSWORD` | Set | Identity + nursery registration |
| `BULK_ADMIN_PASSWORD` | **Missing** | Bulk academy admin users (end of seed) |
| `BULK_ADMIN_EMAIL_DOMAIN` | Missing (defaults to `haryana-sports.in`) | Admin email addresses |

---

## How to verify yourself

```bash
cd khel-setu
pnpm db:check                    # fails today: 25/110 academies
pnpm exec tsx scripts/audit-seed.ts   # full JSON audit (exit 1 = partial/failed)
```

---

## Recommended next steps

1. **Add to `.env`:**
   ```env
   BULK_ADMIN_PASSWORD=your-secure-dev-password
   BULK_ADMIN_EMAIL_DOMAIN=haryana-sports.in   # optional
   ```

2. **Re-run the full seed** (idempotent upserts on slug — safe to re-run):
   ```bash
   pnpm db:seed
   ```
   Expect console output: `academies seeded: 10/110` … `110/110`, then `Bulk seed complete.` and a path to the credentials CSV.

3. **Confirm success:**
   ```bash
   pnpm db:check          # should pass with 110 academies
   pnpm exec tsx scripts/audit-seed.ts   # status: SUCCESS
   ```

4. **Optional cleanup** — if you want a clean bulk-only dataset, soft-delete or remove legacy slugs (`dronacharya`, etc.) after confirming nothing depends on them.

---

## Conclusion

| Layer | Status |
|-------|--------|
| **Migrations** | Successful |
| **Seed script logic** | Working (proven on `ambala-1` … `faridabad-5`) |
| **Full bulk ingestion (110 academies)** | **Not successful** — stopped at ~18% |
| **Admin credential export** | **Not successful** |
| **State nursery catalog** | **Partial** (20/110) |

**Bottom line:** Your database is migrated and partially populated with high-quality demo data for the first four districts, but the bulk seed and ingestion **did not complete**. Set `BULK_ADMIN_PASSWORD` and run `pnpm db:seed` again to finish.
