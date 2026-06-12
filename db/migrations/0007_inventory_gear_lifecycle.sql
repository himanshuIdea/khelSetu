ALTER TABLE "inventory"."gear_movements" ADD COLUMN "team_id" uuid;--> statement-breakpoint
ALTER TABLE "inventory"."gear_movements" ADD COLUMN "expected_return_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "inventory"."gear_movements" ADD COLUMN "related_issue_id" uuid;--> statement-breakpoint
ALTER TABLE "inventory"."gear_movements" ADD CONSTRAINT "gear_movements_item_id_inventory_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "inventory"."inventory_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory"."gear_movements" ADD CONSTRAINT "gear_movements_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "people"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory"."gear_movements" ADD CONSTRAINT "gear_movements_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "competitions"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory"."inventory_items" ADD CONSTRAINT "inventory_items_academy_id_academies_id_fk" FOREIGN KEY ("academy_id") REFERENCES "academy"."academies"("id") ON DELETE no action ON UPDATE no action;
