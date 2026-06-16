CREATE TABLE "operations"."academy_schedule_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"academy_id" uuid NOT NULL,
	"open_minutes" integer NOT NULL,
	"close_minutes" integer NOT NULL,
	"is_configured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "operations"."weekly_schedule_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"academy_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_minutes" integer NOT NULL,
	"end_minutes" integer NOT NULL,
	"sport_id" uuid NOT NULL,
	"coach_id" uuid NOT NULL,
	"venue" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "operations"."weekly_schedule_slot_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slot_id" uuid NOT NULL,
	"batch_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "operations"."academy_schedule_settings" ADD CONSTRAINT "academy_schedule_settings_academy_id_academies_id_fk" FOREIGN KEY ("academy_id") REFERENCES "academy"."academies"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "operations"."weekly_schedule_slots" ADD CONSTRAINT "weekly_schedule_slots_academy_id_academies_id_fk" FOREIGN KEY ("academy_id") REFERENCES "academy"."academies"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "operations"."weekly_schedule_slots" ADD CONSTRAINT "weekly_schedule_slots_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "academy"."sports"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "operations"."weekly_schedule_slots" ADD CONSTRAINT "weekly_schedule_slots_coach_id_coaches_id_fk" FOREIGN KEY ("coach_id") REFERENCES "people"."coaches"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "operations"."weekly_schedule_slot_batches" ADD CONSTRAINT "weekly_schedule_slot_batches_slot_id_weekly_schedule_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "operations"."weekly_schedule_slots"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "operations"."weekly_schedule_slot_batches" ADD CONSTRAINT "weekly_schedule_slot_batches_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "academy"."batches"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "academy_schedule_settings_academy_idx" ON "operations"."academy_schedule_settings" USING btree ("academy_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "weekly_schedule_slots_academy_day_start_idx" ON "operations"."weekly_schedule_slots" USING btree ("academy_id","day_of_week","start_minutes","end_minutes","sport_id","coach_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "weekly_schedule_slot_batches_slot_batch_idx" ON "operations"."weekly_schedule_slot_batches" USING btree ("slot_id","batch_id");
