CREATE TYPE "public"."academy_onboarding_status" AS ENUM('draft', 'submitted', 'under_review', 'needs_action', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."academy_onboarding_request_type" AS ENUM('initial', 'resubmission');--> statement-breakpoint
CREATE TABLE "platform"."academy_onboarding_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "academy_onboarding_status" DEFAULT 'draft' NOT NULL,
	"request_type" "academy_onboarding_request_type" DEFAULT 'initial' NOT NULL,
	"academy_name" text,
	"district" text,
	"slug" text,
	"sports" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"funding_type" "funding_type" DEFAULT 'govt_aided' NOT NULL,
	"brand_color" text DEFAULT '#FF6B2C' NOT NULL,
	"aadhar_number" text,
	"pan_number" text,
	"gst_number" text,
	"aadhar_document_key" text,
	"pan_document_key" text,
	"gst_document_key" text,
	"review_notes" text,
	"required_actions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"reviewed_by_user_id" uuid,
	"reviewed_at" timestamp with time zone,
	"submitted_at" timestamp with time zone,
	"academy_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "platform"."academy_onboarding_requests" ADD CONSTRAINT "academy_onboarding_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform"."academy_onboarding_requests" ADD CONSTRAINT "academy_onboarding_requests_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform"."academy_onboarding_requests" ADD CONSTRAINT "academy_onboarding_requests_academy_id_academies_id_fk" FOREIGN KEY ("academy_id") REFERENCES "academy"."academies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "academy_onboarding_requests_user_idx" ON "platform"."academy_onboarding_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "academy_onboarding_requests_status_idx" ON "platform"."academy_onboarding_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "academy_onboarding_requests_submitted_at_idx" ON "platform"."academy_onboarding_requests" USING btree ("submitted_at");
