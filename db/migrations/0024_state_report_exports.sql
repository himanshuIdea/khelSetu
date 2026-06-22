CREATE TABLE "platform"."state_report_exports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_type" text NOT NULL,
	"format" text NOT NULL,
	"generated_by_user_id" uuid,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "platform"."state_report_exports" ADD CONSTRAINT "state_report_exports_generated_by_user_id_users_id_fk" FOREIGN KEY ("generated_by_user_id") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "state_report_exports_type_idx" ON "platform"."state_report_exports" USING btree ("report_type");--> statement-breakpoint
CREATE INDEX "state_report_exports_generated_at_idx" ON "platform"."state_report_exports" USING btree ("generated_at");
