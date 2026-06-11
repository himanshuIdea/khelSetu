CREATE SCHEMA "identity";
--> statement-breakpoint
CREATE SCHEMA "academy";
--> statement-breakpoint
CREATE SCHEMA "people";
--> statement-breakpoint
CREATE SCHEMA "operations";
--> statement-breakpoint
CREATE SCHEMA "competitions";
--> statement-breakpoint
CREATE SCHEMA "inventory";
--> statement-breakpoint
CREATE SCHEMA "payroll";
--> statement-breakpoint
CREATE SCHEMA "training";
--> statement-breakpoint
CREATE SCHEMA "platform";
--> statement-breakpoint
CREATE TYPE "public"."membership_role" AS ENUM('admin', 'coach', 'staff', 'player');--> statement-breakpoint
CREATE TYPE "public"."funding_type" AS ENUM('govt_aided', 'private');--> statement-breakpoint
CREATE TYPE "public"."employment_type" AS ENUM('full_time', 'part_time');--> statement-breakpoint
CREATE TYPE "public"."nis_level" AS ENUM('nis_level_1', 'nis_level_2', 'in_review');--> statement-breakpoint
CREATE TYPE "public"."player_status" AS ENUM('active', 'on_hold', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."attendance_status" AS ENUM('present', 'absent', 'late');--> statement-breakpoint
CREATE TYPE "public"."fee_status" AS ENUM('paid', 'due', 'partial');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('upcoming', 'marked', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."match_result" AS ENUM('W', 'L');--> statement-breakpoint
CREATE TYPE "public"."match_status" AS ENUM('scheduled', 'live', 'completed');--> statement-breakpoint
CREATE TYPE "public"."selection_status" AS ENUM('selected', 'standby', 'not_selected');--> statement-breakpoint
CREATE TYPE "public"."team_member_role" AS ENUM('captain', 'member');--> statement-breakpoint
CREATE TYPE "public"."tournament_status" AS ENUM('draft', 'live', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."gear_movement_type" AS ENUM('issue', 'return', 'reorder_alert');--> statement-breakpoint
CREATE TYPE "public"."item_condition" AS ENUM('good', 'worn', 'damaged');--> statement-breakpoint
CREATE TYPE "public"."payslip_status" AS ENUM('paid', 'pending');--> statement-breakpoint
CREATE TYPE "public"."drill_submission_status" AS ENUM('pending', 'reviewed');--> statement-breakpoint
CREATE TABLE "identity"."academy_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"academy_id" uuid NOT NULL,
	"role" "membership_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "identity"."users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_user_id" uuid,
	"email" text,
	"phone" text,
	"full_name" text NOT NULL,
	"avatar_initials" text NOT NULL,
	"avatar_color" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "academy"."academies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"district" text NOT NULL,
	"state" text DEFAULT 'Haryana' NOT NULL,
	"funding_type" "funding_type" DEFAULT 'govt_aided' NOT NULL,
	"brand_color" text DEFAULT '#FF6B2C' NOT NULL,
	"initials" text NOT NULL,
	"location_label" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "academy"."academy_sports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"academy_id" uuid NOT NULL,
	"sport_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "academy"."batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"academy_id" uuid NOT NULL,
	"sport_id" uuid NOT NULL,
	"name" text NOT NULL,
	"schedule_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "academy"."sports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "people"."coaches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"academy_id" uuid NOT NULL,
	"user_id" uuid,
	"full_name" text NOT NULL,
	"sport_id" uuid NOT NULL,
	"role_title" text NOT NULL,
	"nis_level" "nis_level" NOT NULL,
	"avatar_color" text NOT NULL,
	"rating" numeric(3, 1) DEFAULT '0' NOT NULL,
	"drills_per_week" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "people"."players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"academy_id" uuid NOT NULL,
	"external_id" text NOT NULL,
	"full_name" text NOT NULL,
	"sport_id" uuid NOT NULL,
	"batch_id" uuid,
	"date_of_birth" timestamp with time zone,
	"weight_category" text,
	"status" "player_status" DEFAULT 'active' NOT NULL,
	"avatar_color" text NOT NULL,
	"joined_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "people"."staff" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"academy_id" uuid NOT NULL,
	"user_id" uuid,
	"full_name" text NOT NULL,
	"role_title" text NOT NULL,
	"employment_type" "employment_type" DEFAULT 'full_time' NOT NULL,
	"monthly_salary_paise" integer NOT NULL,
	"avatar_color" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "operations"."attendance_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"status" "attendance_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "operations"."fee_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"academy_id" uuid NOT NULL,
	"period" text NOT NULL,
	"amount_paise" integer NOT NULL,
	"status" "fee_status" DEFAULT 'due' NOT NULL,
	"due_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "operations"."fee_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"amount_paise" integer NOT NULL,
	"paid_at" timestamp with time zone DEFAULT now() NOT NULL,
	"method" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "operations"."training_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"academy_id" uuid NOT NULL,
	"batch_id" uuid,
	"coach_id" uuid NOT NULL,
	"sport_id" uuid NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"venue" text,
	"status" "session_status" DEFAULT 'upcoming' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competitions"."team_member_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_member_id" uuid NOT NULL,
	"result" "match_result" NOT NULL,
	"sequence" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competitions"."team_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"role" "team_member_role" DEFAULT 'member' NOT NULL,
	"selection_status" "selection_status" DEFAULT 'selected' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competitions"."teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"academy_id" uuid NOT NULL,
	"sport_id" uuid NOT NULL,
	"name" text NOT NULL,
	"coach_id" uuid,
	"weight_class" text,
	"color" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competitions"."tournament_matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" uuid NOT NULL,
	"round" text NOT NULL,
	"bracket_position" integer NOT NULL,
	"mat_label" text,
	"scheduled_at" timestamp with time zone,
	"player_a_id" uuid,
	"player_b_id" uuid,
	"player_a_name" text,
	"player_b_name" text,
	"score_a" integer,
	"score_b" integer,
	"winner_player_id" uuid,
	"status" "match_status" DEFAULT 'scheduled' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competitions"."tournaments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"academy_id" uuid NOT NULL,
	"name" text NOT NULL,
	"location" text NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"status" "tournament_status" DEFAULT 'draft' NOT NULL,
	"sport_id" uuid NOT NULL,
	"weight_class" text,
	"participant_academies" integer,
	"participant_athletes" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory"."gear_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"player_id" uuid,
	"quantity" integer DEFAULT 1 NOT NULL,
	"type" "gear_movement_type" NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory"."inventory_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"academy_id" uuid NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"in_stock" integer DEFAULT 0 NOT NULL,
	"issued_count" integer DEFAULT 0 NOT NULL,
	"condition" "item_condition" DEFAULT 'good' NOT NULL,
	"low_stock_threshold" integer DEFAULT 10 NOT NULL,
	"icon_bg" text,
	"icon_color" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll"."payroll_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"academy_id" uuid NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll"."payslips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payroll_run_id" uuid NOT NULL,
	"staff_id" uuid NOT NULL,
	"days_present" integer NOT NULL,
	"days_expected" integer NOT NULL,
	"amount_paise" integer NOT NULL,
	"status" "payslip_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training"."drill_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"reviewer_coach_id" uuid NOT NULL,
	"rating" integer,
	"notes" text,
	"reviewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training"."drill_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"academy_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"coach_id" uuid NOT NULL,
	"drill_name" text NOT NULL,
	"thumbnail_gradient" text,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" "drill_submission_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform"."activity_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"academy_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"actor_name" text NOT NULL,
	"description" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform"."outbox_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"aggregate_type" text NOT NULL,
	"aggregate_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX "academy_memberships_user_academy_idx" ON "identity"."academy_memberships" USING btree ("user_id","academy_id");--> statement-breakpoint
CREATE UNIQUE INDEX "academies_slug_idx" ON "academy"."academies" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "academy_sports_academy_sport_idx" ON "academy"."academy_sports" USING btree ("academy_id","sport_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sports_name_idx" ON "academy"."sports" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "players_academy_external_id_idx" ON "people"."players" USING btree ("academy_id","external_id");--> statement-breakpoint
CREATE UNIQUE INDEX "attendance_records_session_player_idx" ON "operations"."attendance_records" USING btree ("session_id","player_id");