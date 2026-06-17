CREATE TABLE "training"."coach_drill_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"academy_id" uuid NOT NULL,
	"coach_id" uuid NOT NULL,
	"sport_id" uuid NOT NULL,
	"batch_id" uuid,
	"drill_name" text NOT NULL,
	"description" text,
	"video_url" text NOT NULL,
	"thumbnail_gradient" text,
	"duration_seconds" integer,
	"posted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "training"."drill_submissions" ADD COLUMN "drill_post_id" uuid;
--> statement-breakpoint
ALTER TABLE "training"."drill_reviews" ADD COLUMN "criteria_scores" jsonb;
--> statement-breakpoint
ALTER TABLE "training"."coach_drill_posts" ADD CONSTRAINT "coach_drill_posts_academy_id_academies_id_fk" FOREIGN KEY ("academy_id") REFERENCES "academy"."academies"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "training"."coach_drill_posts" ADD CONSTRAINT "coach_drill_posts_coach_id_coaches_id_fk" FOREIGN KEY ("coach_id") REFERENCES "people"."coaches"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "training"."coach_drill_posts" ADD CONSTRAINT "coach_drill_posts_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "academy"."sports"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "training"."coach_drill_posts" ADD CONSTRAINT "coach_drill_posts_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "academy"."batches"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "training"."drill_submissions" ADD CONSTRAINT "drill_submissions_drill_post_id_coach_drill_posts_id_fk" FOREIGN KEY ("drill_post_id") REFERENCES "training"."coach_drill_posts"("id") ON DELETE no action ON UPDATE no action;
