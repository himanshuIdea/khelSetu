CREATE INDEX "players_academy_status_idx" ON "people"."players" USING btree ("academy_id", "status");--> statement-breakpoint
CREATE INDEX "fee_invoices_academy_status_idx" ON "operations"."fee_invoices" USING btree ("academy_id", "status");
