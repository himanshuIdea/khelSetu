CREATE TYPE "public"."staff_attendance_status" AS ENUM('present', 'absent', 'leave');--> statement-breakpoint
CREATE TABLE "operations"."fee_plan_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"academy_id" uuid NOT NULL,
	"sport_id" uuid,
	"batch_id" uuid,
	"label" text NOT NULL,
	"amount_paise" integer NOT NULL,
	"billing_cycle_months" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "operations"."fee_targets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"academy_id" uuid NOT NULL,
	"period" text NOT NULL,
	"target_paise" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "operations"."staff_attendance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"staff_id" uuid NOT NULL,
	"academy_id" uuid NOT NULL,
	"attendance_date" timestamp with time zone NOT NULL,
	"status" "staff_attendance_status" DEFAULT 'present' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "operations"."fee_invoices" ADD COLUMN "paid_through_period" text;--> statement-breakpoint
ALTER TABLE "operations"."training_sessions" ADD COLUMN "expected_headcount" integer;--> statement-breakpoint
ALTER TABLE "operations"."fee_plan_templates" ADD CONSTRAINT "fee_plan_templates_academy_id_academies_id_fk" FOREIGN KEY ("academy_id") REFERENCES "academy"."academies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations"."fee_plan_templates" ADD CONSTRAINT "fee_plan_templates_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "academy"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations"."fee_targets" ADD CONSTRAINT "fee_targets_academy_id_academies_id_fk" FOREIGN KEY ("academy_id") REFERENCES "academy"."academies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations"."staff_attendance" ADD CONSTRAINT "staff_attendance_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "people"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations"."staff_attendance" ADD CONSTRAINT "staff_attendance_academy_id_academies_id_fk" FOREIGN KEY ("academy_id") REFERENCES "academy"."academies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "fee_targets_academy_period_idx" ON "operations"."fee_targets" USING btree ("academy_id","period");--> statement-breakpoint
CREATE UNIQUE INDEX "staff_attendance_staff_date_idx" ON "operations"."staff_attendance" USING btree ("staff_id","attendance_date");--> statement-breakpoint
ALTER TABLE "operations"."attendance_records" ADD CONSTRAINT "attendance_records_session_id_training_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "operations"."training_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations"."attendance_records" ADD CONSTRAINT "attendance_records_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "people"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations"."fee_invoices" ADD CONSTRAINT "fee_invoices_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "people"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations"."fee_invoices" ADD CONSTRAINT "fee_invoices_academy_id_academies_id_fk" FOREIGN KEY ("academy_id") REFERENCES "academy"."academies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations"."fee_payments" ADD CONSTRAINT "fee_payments_invoice_id_fee_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "operations"."fee_invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations"."training_sessions" ADD CONSTRAINT "training_sessions_academy_id_academies_id_fk" FOREIGN KEY ("academy_id") REFERENCES "academy"."academies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations"."training_sessions" ADD CONSTRAINT "training_sessions_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "academy"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operations"."training_sessions" ADD CONSTRAINT "training_sessions_coach_id_coaches_id_fk" FOREIGN KEY ("coach_id") REFERENCES "people"."coaches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
WITH "ranked_invoices" AS (
	SELECT
		"id",
		"player_id",
		"period",
		ROW_NUMBER() OVER (
			PARTITION BY "player_id", "period"
			ORDER BY "created_at" DESC
		) AS "rn"
	FROM "operations"."fee_invoices"
),
"keepers" AS (
	SELECT "player_id", "period", "id" AS "keep_id"
	FROM "ranked_invoices"
	WHERE "rn" = 1
),
"dupes" AS (
	SELECT "ranked_invoices"."id" AS "dupe_id", "keepers"."keep_id"
	FROM "ranked_invoices"
	INNER JOIN "keepers" USING ("player_id", "period")
	WHERE "ranked_invoices"."rn" > 1
)
UPDATE "operations"."fee_payments" fp
SET "invoice_id" = "dupes"."keep_id"
FROM "dupes"
WHERE fp."invoice_id" = "dupes"."dupe_id";--> statement-breakpoint
DELETE FROM "operations"."fee_invoices" fi
USING (
	SELECT "id"
	FROM (
		SELECT
			"id",
			ROW_NUMBER() OVER (
				PARTITION BY "player_id", "period"
				ORDER BY "created_at" DESC
			) AS "rn"
		FROM "operations"."fee_invoices"
	) ranked
	WHERE ranked."rn" > 1
) dupes
WHERE fi."id" = dupes."id";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "fee_invoices_player_period_idx" ON "operations"."fee_invoices" USING btree ("player_id","period");
