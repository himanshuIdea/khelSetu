CREATE TYPE "public"."scouting_status" AS ENUM(
  'khelo_india',
  'shortlisted_for_nationals',
  'shortlisted_for_states',
  'in_trials',
  'not_selected',
  'watchlist'
);--> statement-breakpoint
ALTER TABLE "people"."players" ADD COLUMN "scouting_status" "scouting_status";--> statement-breakpoint
ALTER TABLE "people"."players" ADD COLUMN "scouting_status_set_at" timestamp with time zone;
