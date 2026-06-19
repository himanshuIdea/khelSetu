CREATE TYPE "public"."nursery_flag_response_status" AS ENUM('none', 'addressed', 'review_requested');--> statement-breakpoint
ALTER TABLE "platform"."state_nursery_registrations" ADD COLUMN "flag_note" text;--> statement-breakpoint
ALTER TABLE "platform"."state_nursery_registrations" ADD COLUMN "flag_guidelines" text;--> statement-breakpoint
ALTER TABLE "platform"."state_nursery_registrations" ADD COLUMN "flagged_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "platform"."state_nursery_registrations" ADD COLUMN "flagged_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "platform"."state_nursery_registrations" ADD COLUMN "flag_response_status" "nursery_flag_response_status" DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "platform"."state_nursery_registrations" ADD COLUMN "flag_response_note" text;--> statement-breakpoint
ALTER TABLE "platform"."state_nursery_registrations" ADD COLUMN "flag_response_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "platform"."state_nursery_registrations" ADD CONSTRAINT "state_nursery_registrations_flagged_by_user_id_users_id_fk" FOREIGN KEY ("flagged_by_user_id") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;
