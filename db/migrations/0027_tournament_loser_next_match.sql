ALTER TABLE "competitions"."tournament_matches" ADD COLUMN IF NOT EXISTS "loser_next_match_id" uuid;
