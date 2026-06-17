CREATE TYPE "public"."nursery_verification_status" AS ENUM('verified', 'pending', 'flagged');--> statement-breakpoint
CREATE TABLE "platform"."state_nursery_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"academy_id" uuid NOT NULL,
	"verification_status" "nursery_verification_status" DEFAULT 'verified' NOT NULL,
	"registered_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "platform"."state_nursery_registrations" ADD CONSTRAINT "state_nursery_registrations_academy_id_academies_id_fk" FOREIGN KEY ("academy_id") REFERENCES "academy"."academies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform"."state_nursery_registrations" ADD CONSTRAINT "state_nursery_registrations_registered_by_user_id_users_id_fk" FOREIGN KEY ("registered_by_user_id") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "state_nursery_registrations_academy_idx" ON "platform"."state_nursery_registrations" USING btree ("academy_id");
