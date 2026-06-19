-- Zero mock/demo state fund allocations and remove seeded demo disbursements.
UPDATE "platform"."state_fund_schemes"
SET "allocated_amount_paise" = 0, "updated_at" = now()
WHERE "allocated_amount_paise" IN (
  1613636364,
  1195121951,
  802631579,
  593406593,
  375000000,
  145833333,
  14200000000,
  9800000000,
  6100000000,
  5400000000,
  2400000000,
  700000000
);
--> statement-breakpoint
UPDATE "platform"."state_fiscal_years"
SET "total_allocated_amount_paise" = 0, "updated_at" = now()
WHERE "total_allocated_amount_paise" = 47100000000;
--> statement-breakpoint
DELETE FROM "platform"."state_fund_disbursements"
WHERE "reference_note" = 'FY 2026-27 pilot grant'
   OR "reference_note" = 'Equipment grant — Q1';
