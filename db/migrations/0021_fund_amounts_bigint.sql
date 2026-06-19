ALTER TABLE "platform"."state_fund_schemes"
  ALTER COLUMN "allocated_amount_paise" TYPE bigint USING "allocated_amount_paise"::bigint;--> statement-breakpoint
ALTER TABLE "platform"."state_fund_disbursements"
  ALTER COLUMN "amount_paise" TYPE bigint USING "amount_paise"::bigint;--> statement-breakpoint
UPDATE "platform"."state_fund_schemes" SET "allocated_amount_paise" = 14200000000, "updated_at" = now() WHERE "slug" = 'padak-lao' AND "allocated_amount_paise" IN (0, 1613636364);--> statement-breakpoint
UPDATE "platform"."state_fund_schemes" SET "allocated_amount_paise" = 9800000000, "updated_at" = now() WHERE "slug" = 'sports-scholarships' AND "allocated_amount_paise" = 1195121951;--> statement-breakpoint
UPDATE "platform"."state_fund_schemes" SET "allocated_amount_paise" = 6100000000, "updated_at" = now() WHERE "slug" = 'diet-allowance' AND "allocated_amount_paise" = 802631579;--> statement-breakpoint
UPDATE "platform"."state_fund_schemes" SET "allocated_amount_paise" = 5400000000, "updated_at" = now() WHERE "slug" = 'coach-honorarium' AND "allocated_amount_paise" = 593406593;--> statement-breakpoint
UPDATE "platform"."state_fund_schemes" SET "allocated_amount_paise" = 2400000000, "updated_at" = now() WHERE "slug" = 'nursery-equipment' AND "allocated_amount_paise" = 375000000;--> statement-breakpoint
UPDATE "platform"."state_fund_schemes" SET "allocated_amount_paise" = 700000000, "updated_at" = now() WHERE "slug" = 'athlete-insurance' AND "allocated_amount_paise" = 145833333;
