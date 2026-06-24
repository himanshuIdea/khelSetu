CREATE INDEX IF NOT EXISTS "players_academy_scouting_status_idx" ON "people"."players" USING btree ("academy_id", "scouting_status");
