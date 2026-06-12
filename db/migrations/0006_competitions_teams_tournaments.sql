CREATE TYPE "public"."fixture_status" AS ENUM('scheduled', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."medal_type" AS ENUM('gold', 'silver', 'bronze');--> statement-breakpoint
CREATE TABLE "competitions"."lineup_suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"tournament_id" uuid,
	"title" text NOT NULL,
	"suggested_player_ids" jsonb NOT NULL,
	"rationale" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "competitions"."team_fixtures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"tournament_id" uuid,
	"opponent_name" text NOT NULL,
	"venue" text NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"status" "fixture_status" DEFAULT 'scheduled' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "competitions"."tournament_medals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" uuid NOT NULL,
	"academy_id" uuid NOT NULL,
	"gold" integer DEFAULT 0 NOT NULL,
	"silver" integer DEFAULT 0 NOT NULL,
	"bronze" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "competitions"."tournament_matches" ADD COLUMN "next_match_id" uuid;--> statement-breakpoint
ALTER TABLE "competitions"."tournament_matches" ADD COLUMN "medal_type" "medal_type";--> statement-breakpoint
ALTER TABLE "competitions"."lineup_suggestions" ADD CONSTRAINT "lineup_suggestions_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "competitions"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitions"."team_fixtures" ADD CONSTRAINT "team_fixtures_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "competitions"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitions"."tournament_medals" ADD CONSTRAINT "tournament_medals_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "competitions"."tournaments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitions"."tournament_medals" ADD CONSTRAINT "tournament_medals_academy_id_academies_id_fk" FOREIGN KEY ("academy_id") REFERENCES "academy"."academies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "tournament_medals_tournament_idx" ON "competitions"."tournament_medals" USING btree ("tournament_id");--> statement-breakpoint
ALTER TABLE "competitions"."team_member_results" ADD CONSTRAINT "team_member_results_team_member_id_team_members_id_fk" FOREIGN KEY ("team_member_id") REFERENCES "competitions"."team_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitions"."team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "competitions"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitions"."team_members" ADD CONSTRAINT "team_members_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "people"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitions"."teams" ADD CONSTRAINT "teams_academy_id_academies_id_fk" FOREIGN KEY ("academy_id") REFERENCES "academy"."academies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitions"."teams" ADD CONSTRAINT "teams_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "academy"."sports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitions"."teams" ADD CONSTRAINT "teams_coach_id_coaches_id_fk" FOREIGN KEY ("coach_id") REFERENCES "people"."coaches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitions"."tournament_matches" ADD CONSTRAINT "tournament_matches_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "competitions"."tournaments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitions"."tournament_matches" ADD CONSTRAINT "tournament_matches_player_a_id_players_id_fk" FOREIGN KEY ("player_a_id") REFERENCES "people"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitions"."tournament_matches" ADD CONSTRAINT "tournament_matches_player_b_id_players_id_fk" FOREIGN KEY ("player_b_id") REFERENCES "people"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitions"."tournament_matches" ADD CONSTRAINT "tournament_matches_winner_player_id_players_id_fk" FOREIGN KEY ("winner_player_id") REFERENCES "people"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitions"."tournaments" ADD CONSTRAINT "tournaments_academy_id_academies_id_fk" FOREIGN KEY ("academy_id") REFERENCES "academy"."academies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitions"."tournaments" ADD CONSTRAINT "tournaments_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "academy"."sports"("id") ON DELETE no action ON UPDATE no action;
