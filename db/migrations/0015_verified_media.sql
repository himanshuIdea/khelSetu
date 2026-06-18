CREATE TYPE "training"."media_feed_item_type" AS ENUM('player_submission', 'coach_post');
--> statement-breakpoint
ALTER TABLE "training"."drill_submissions" ADD COLUMN "video_url" text;
--> statement-breakpoint
ALTER TABLE "training"."drill_submissions" ADD COLUMN "duration_seconds" integer;
--> statement-breakpoint
ALTER TABLE "training"."drill_submissions" ADD COLUMN "published_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "training"."drill_submissions" ADD COLUMN "published_by_coach_id" uuid;
--> statement-breakpoint
ALTER TABLE "training"."coach_drill_posts" ADD COLUMN "published_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "training"."coach_drill_posts" ADD COLUMN "published_by_coach_id" uuid;
--> statement-breakpoint
ALTER TABLE "training"."drill_submissions" ADD CONSTRAINT "drill_submissions_published_by_coach_id_coaches_id_fk" FOREIGN KEY ("published_by_coach_id") REFERENCES "people"."coaches"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "training"."coach_drill_posts" ADD CONSTRAINT "coach_drill_posts_published_by_coach_id_coaches_id_fk" FOREIGN KEY ("published_by_coach_id") REFERENCES "people"."coaches"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE TABLE "training"."media_post_likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"academy_id" uuid NOT NULL,
	"item_type" "training"."media_feed_item_type" NOT NULL,
	"item_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training"."media_post_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"academy_id" uuid NOT NULL,
	"item_type" "training"."media_feed_item_type" NOT NULL,
	"item_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training"."player_follows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"academy_id" uuid NOT NULL,
	"follower_player_id" uuid NOT NULL,
	"followed_player_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "training"."media_post_likes" ADD CONSTRAINT "media_post_likes_academy_id_academies_id_fk" FOREIGN KEY ("academy_id") REFERENCES "academy"."academies"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "training"."media_post_likes" ADD CONSTRAINT "media_post_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "training"."media_post_comments" ADD CONSTRAINT "media_post_comments_academy_id_academies_id_fk" FOREIGN KEY ("academy_id") REFERENCES "academy"."academies"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "training"."media_post_comments" ADD CONSTRAINT "media_post_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "training"."player_follows" ADD CONSTRAINT "player_follows_academy_id_academies_id_fk" FOREIGN KEY ("academy_id") REFERENCES "academy"."academies"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "training"."player_follows" ADD CONSTRAINT "player_follows_follower_player_id_players_id_fk" FOREIGN KEY ("follower_player_id") REFERENCES "people"."players"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "training"."player_follows" ADD CONSTRAINT "player_follows_followed_player_id_players_id_fk" FOREIGN KEY ("followed_player_id") REFERENCES "people"."players"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "media_post_likes_unique_idx" ON "training"."media_post_likes" ("user_id","item_type","item_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "player_follows_unique_idx" ON "training"."player_follows" ("follower_player_id","followed_player_id");
