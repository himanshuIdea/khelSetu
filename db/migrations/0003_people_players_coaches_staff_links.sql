ALTER TABLE "people"."coaches" ADD COLUMN "staff_id" uuid;--> statement-breakpoint
ALTER TABLE "people"."players" ADD COLUMN "primary_coach_id" uuid;--> statement-breakpoint
ALTER TABLE "people"."players" ADD COLUMN "rating" numeric(3, 1);--> statement-breakpoint
ALTER TABLE "people"."players" ADD COLUMN "monthly_fee_paise" integer;--> statement-breakpoint
ALTER TABLE "people"."players" ADD COLUMN "notes" text;--> statement-breakpoint
CREATE TABLE "people"."player_coach_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"coach_id" uuid NOT NULL,
	"batch_id" uuid,
	"is_primary" boolean DEFAULT false NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "people"."player_coach_assignments" ADD CONSTRAINT "player_coach_assignments_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "people"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "people"."player_coach_assignments" ADD CONSTRAINT "player_coach_assignments_coach_id_coaches_id_fk" FOREIGN KEY ("coach_id") REFERENCES "people"."coaches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "people"."player_coach_assignments" ADD CONSTRAINT "player_coach_assignments_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "academy"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "player_coach_assignments_player_coach_idx" ON "people"."player_coach_assignments" USING btree ("player_id","coach_id");--> statement-breakpoint
ALTER TABLE "people"."coaches" ADD CONSTRAINT "coaches_academy_id_academies_id_fk" FOREIGN KEY ("academy_id") REFERENCES "academy"."academies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "people"."coaches" ADD CONSTRAINT "coaches_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "people"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "people"."coaches" ADD CONSTRAINT "coaches_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "academy"."sports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "people"."players" ADD CONSTRAINT "players_academy_id_academies_id_fk" FOREIGN KEY ("academy_id") REFERENCES "academy"."academies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "people"."players" ADD CONSTRAINT "players_sport_id_sports_id_fk" FOREIGN KEY ("sport_id") REFERENCES "academy"."sports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "people"."players" ADD CONSTRAINT "players_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "academy"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "people"."players" ADD CONSTRAINT "players_primary_coach_id_coaches_id_fk" FOREIGN KEY ("primary_coach_id") REFERENCES "people"."coaches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "people"."staff" ADD CONSTRAINT "staff_academy_id_academies_id_fk" FOREIGN KEY ("academy_id") REFERENCES "academy"."academies"("id") ON DELETE no action ON UPDATE no action;
