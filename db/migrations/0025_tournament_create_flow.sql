DO $$ BEGIN
 CREATE TYPE "public"."participation_scope" AS ENUM('intra_academy', 'inter_academy');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."competition_format" AS ENUM('knockout', 'double_elimination', 'round_robin', 'pool_knockout', 'heats', 'trial');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."age_division" AS ENUM('sub_junior', 'junior', 'senior');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 IF EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'competitions' AND table_name = 'tournaments' AND column_name = 'scope'
 ) AND NOT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'competitions' AND table_name = 'tournaments' AND column_name = 'participation_scope'
 ) THEN
  ALTER TABLE "competitions"."tournaments" ADD COLUMN "participation_scope" "participation_scope" DEFAULT 'intra_academy' NOT NULL;
  UPDATE "competitions"."tournaments"
  SET "participation_scope" = CASE
   WHEN "scope"::text = 'inter_academy' THEN 'inter_academy'::"participation_scope"
   ELSE 'intra_academy'::"participation_scope"
  END;
  ALTER TABLE "competitions"."tournaments" DROP COLUMN "scope";
 END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
 IF NOT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'competitions' AND table_name = 'tournaments' AND column_name = 'participation_scope'
 ) THEN
  ALTER TABLE "competitions"."tournaments" ADD COLUMN "participation_scope" "participation_scope" DEFAULT 'intra_academy' NOT NULL;
 END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
 IF EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'competitions' AND table_name = 'tournaments' AND column_name = 'format'
 ) AND NOT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'competitions' AND table_name = 'tournaments' AND column_name = 'competition_format'
 ) THEN
  ALTER TABLE "competitions"."tournaments" ADD COLUMN "competition_format" "competition_format" DEFAULT 'knockout' NOT NULL;
  UPDATE "competitions"."tournaments"
  SET "competition_format" = CASE "format"::text
   WHEN 'knockout' THEN 'knockout'::"competition_format"
   WHEN 'double_elimination' THEN 'double_elimination'::"competition_format"
   WHEN 'round_robin' THEN 'round_robin'::"competition_format"
   WHEN 'pool_knockout' THEN 'pool_knockout'::"competition_format"
   WHEN 'heats' THEN 'heats'::"competition_format"
   WHEN 'trial' THEN 'trial'::"competition_format"
   ELSE 'knockout'::"competition_format"
  END;
  ALTER TABLE "competitions"."tournaments" DROP COLUMN "format";
 END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
 IF NOT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'competitions' AND table_name = 'tournaments' AND column_name = 'competition_format'
 ) THEN
  ALTER TABLE "competitions"."tournaments" ADD COLUMN "competition_format" "competition_format" DEFAULT 'knockout' NOT NULL;
 END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
 IF NOT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'competitions' AND table_name = 'tournaments' AND column_name = 'age_division'
 ) THEN
  ALTER TABLE "competitions"."tournaments" ADD COLUMN "age_division" "age_division" DEFAULT 'senior' NOT NULL;
 END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
 IF NOT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'competitions' AND table_name = 'tournaments' AND column_name = 'description'
 ) THEN
  ALTER TABLE "competitions"."tournaments" ADD COLUMN "description" text;
 END IF;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "competitions"."tournament_pools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" uuid NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "competitions"."tournament_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"academy_id" uuid NOT NULL,
	"seed_order" integer,
	"pool_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "competitions"."tournament_standings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pool_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"played" integer DEFAULT 0 NOT NULL,
	"won" integer DEFAULT 0 NOT NULL,
	"lost" integer DEFAULT 0 NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"rank" integer,
	"result_value" numeric(10, 3),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "competitions"."tournament_matches" ADD COLUMN IF NOT EXISTS "pool_id" uuid;--> statement-breakpoint
ALTER TABLE "competitions"."tournament_matches" ADD COLUMN IF NOT EXISTS "heat_number" integer;--> statement-breakpoint
ALTER TABLE "competitions"."tournament_matches" ADD COLUMN IF NOT EXISTS "lane_number" integer;--> statement-breakpoint
ALTER TABLE "competitions"."tournament_matches" ADD COLUMN IF NOT EXISTS "group_label" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "competitions"."tournament_pools" ADD CONSTRAINT "tournament_pools_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "competitions"."tournaments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "competitions"."tournament_participants" ADD CONSTRAINT "tournament_participants_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "competitions"."tournaments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "competitions"."tournament_participants" ADD CONSTRAINT "tournament_participants_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "people"."players"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "competitions"."tournament_participants" ADD CONSTRAINT "tournament_participants_academy_id_academies_id_fk" FOREIGN KEY ("academy_id") REFERENCES "academy"."academies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "competitions"."tournament_participants" ADD CONSTRAINT "tournament_participants_pool_id_tournament_pools_id_fk" FOREIGN KEY ("pool_id") REFERENCES "competitions"."tournament_pools"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "competitions"."tournament_standings" ADD CONSTRAINT "tournament_standings_pool_id_tournament_pools_id_fk" FOREIGN KEY ("pool_id") REFERENCES "competitions"."tournament_pools"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "competitions"."tournament_standings" ADD CONSTRAINT "tournament_standings_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "people"."players"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "competitions"."tournament_matches" ADD CONSTRAINT "tournament_matches_pool_id_tournament_pools_id_fk" FOREIGN KEY ("pool_id") REFERENCES "competitions"."tournament_pools"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "tournament_participants_tournament_player_idx" ON "competitions"."tournament_participants" USING btree ("tournament_id","player_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "tournament_standings_pool_player_idx" ON "competitions"."tournament_standings" USING btree ("pool_id","player_id");
