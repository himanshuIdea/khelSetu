CREATE TYPE "public"."report_status" AS ENUM('pending', 'ready', 'failed');--> statement-breakpoint
CREATE TABLE "platform"."report_exports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"academy_id" uuid NOT NULL,
	"report_type" text NOT NULL,
	"period_label" text NOT NULL,
	"status" "report_status" DEFAULT 'pending' NOT NULL,
	"file_url" text,
	"generated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "platform"."report_exports" ADD CONSTRAINT "report_exports_academy_id_academies_id_fk" FOREIGN KEY ("academy_id") REFERENCES "academy"."academies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training"."drill_reviews" ADD CONSTRAINT "drill_reviews_submission_id_drill_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "training"."drill_submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training"."drill_reviews" ADD CONSTRAINT "drill_reviews_reviewer_coach_id_coaches_id_fk" FOREIGN KEY ("reviewer_coach_id") REFERENCES "people"."coaches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training"."drill_submissions" ADD CONSTRAINT "drill_submissions_academy_id_academies_id_fk" FOREIGN KEY ("academy_id") REFERENCES "academy"."academies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training"."drill_submissions" ADD CONSTRAINT "drill_submissions_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "people"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training"."drill_submissions" ADD CONSTRAINT "drill_submissions_coach_id_coaches_id_fk" FOREIGN KEY ("coach_id") REFERENCES "people"."coaches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform"."activity_events" ADD CONSTRAINT "activity_events_academy_id_academies_id_fk" FOREIGN KEY ("academy_id") REFERENCES "academy"."academies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "drill_reviews_submission_idx" ON "training"."drill_reviews" USING btree ("submission_id");
