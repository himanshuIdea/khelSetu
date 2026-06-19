CREATE TYPE "public"."state_fund_scheme_beneficiary_type" AS ENUM('athlete', 'coach', 'nursery');--> statement-breakpoint
CREATE TYPE "public"."state_fund_disbursement_status" AS ENUM('pending', 'paid');--> statement-breakpoint
CREATE TABLE "platform"."state_fiscal_years" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" text NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "platform"."state_fund_schemes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fiscal_year_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"subtitle" text NOT NULL,
	"beneficiary_type" "state_fund_scheme_beneficiary_type" NOT NULL,
	"allocated_amount_paise" integer DEFAULT 0 NOT NULL,
	"color" text DEFAULT '#12B886' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "platform"."state_fund_disbursements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scheme_id" uuid NOT NULL,
	"amount_paise" integer NOT NULL,
	"status" "state_fund_disbursement_status" DEFAULT 'pending' NOT NULL,
	"player_id" uuid,
	"coach_id" uuid,
	"academy_id" uuid,
	"due_date" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"reference_note" text,
	"created_by_user_id" uuid NOT NULL,
	"paid_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "state_fund_disbursements_beneficiary_chk" CHECK (
		(
			"player_id" IS NOT NULL
			AND "coach_id" IS NULL
			AND "academy_id" IS NULL
		)
		OR (
			"coach_id" IS NOT NULL
			AND "player_id" IS NULL
			AND "academy_id" IS NULL
		)
		OR (
			"academy_id" IS NOT NULL
			AND "player_id" IS NULL
			AND "coach_id" IS NULL
		)
	)
);--> statement-breakpoint
ALTER TABLE "platform"."state_fund_schemes" ADD CONSTRAINT "state_fund_schemes_fiscal_year_id_state_fiscal_years_id_fk" FOREIGN KEY ("fiscal_year_id") REFERENCES "platform"."state_fiscal_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform"."state_fund_disbursements" ADD CONSTRAINT "state_fund_disbursements_scheme_id_state_fund_schemes_id_fk" FOREIGN KEY ("scheme_id") REFERENCES "platform"."state_fund_schemes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform"."state_fund_disbursements" ADD CONSTRAINT "state_fund_disbursements_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "people"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform"."state_fund_disbursements" ADD CONSTRAINT "state_fund_disbursements_coach_id_coaches_id_fk" FOREIGN KEY ("coach_id") REFERENCES "people"."coaches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform"."state_fund_disbursements" ADD CONSTRAINT "state_fund_disbursements_academy_id_academies_id_fk" FOREIGN KEY ("academy_id") REFERENCES "academy"."academies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform"."state_fund_disbursements" ADD CONSTRAINT "state_fund_disbursements_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform"."state_fund_disbursements" ADD CONSTRAINT "state_fund_disbursements_paid_by_user_id_users_id_fk" FOREIGN KEY ("paid_by_user_id") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "state_fiscal_years_label_idx" ON "platform"."state_fiscal_years" USING btree ("label");--> statement-breakpoint
CREATE UNIQUE INDEX "state_fund_schemes_fy_slug_idx" ON "platform"."state_fund_schemes" USING btree ("fiscal_year_id","slug");--> statement-breakpoint
CREATE INDEX "state_fund_schemes_fiscal_year_idx" ON "platform"."state_fund_schemes" USING btree ("fiscal_year_id");--> statement-breakpoint
CREATE INDEX "state_fund_disbursements_scheme_idx" ON "platform"."state_fund_disbursements" USING btree ("scheme_id");--> statement-breakpoint
CREATE INDEX "state_fund_disbursements_status_idx" ON "platform"."state_fund_disbursements" USING btree ("status");--> statement-breakpoint
CREATE INDEX "state_fund_disbursements_player_idx" ON "platform"."state_fund_disbursements" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "state_fund_disbursements_coach_idx" ON "platform"."state_fund_disbursements" USING btree ("coach_id");--> statement-breakpoint
CREATE INDEX "state_fund_disbursements_academy_idx" ON "platform"."state_fund_disbursements" USING btree ("academy_id");
