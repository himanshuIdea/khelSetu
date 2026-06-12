CREATE TYPE "public"."platform_role" AS ENUM('state_admin');--> statement-breakpoint
ALTER TABLE "identity"."users" ADD COLUMN "password_hash" text;--> statement-breakpoint
ALTER TABLE "identity"."users" ADD COLUMN "phone_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "identity"."users" ADD COLUMN "platform_role" "platform_role";--> statement-breakpoint
CREATE UNIQUE INDEX "users_phone_idx" ON "identity"."users" USING btree ("phone");