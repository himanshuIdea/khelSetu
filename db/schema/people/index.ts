import { integer, numeric, pgEnum, pgSchema, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { primaryId, timestamps } from "../_shared";

export const peopleSchema = pgSchema("people");

export const playerStatusEnum = pgEnum("player_status", ["active", "on_hold", "inactive"]);
export const nisLevelEnum = pgEnum("nis_level", ["nis_level_1", "nis_level_2", "in_review"]);
export const employmentTypeEnum = pgEnum("employment_type", ["full_time", "part_time"]);

export const players = peopleSchema.table(
  "players",
  {
    id: primaryId(),
    academyId: uuid("academy_id").notNull(),
    externalId: text("external_id").notNull(),
    fullName: text("full_name").notNull(),
    sportId: uuid("sport_id").notNull(),
    batchId: uuid("batch_id"),
    dateOfBirth: timestamp("date_of_birth", { withTimezone: true }),
    weightCategory: text("weight_category"),
    status: playerStatusEnum("status").notNull().default("active"),
    avatarColor: text("avatar_color").notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("players_academy_external_id_idx").on(table.academyId, table.externalId),
  ]
);

export const coaches = peopleSchema.table("coaches", {
  id: primaryId(),
  academyId: uuid("academy_id").notNull(),
  userId: uuid("user_id"),
  fullName: text("full_name").notNull(),
  sportId: uuid("sport_id").notNull(),
  roleTitle: text("role_title").notNull(),
  nisLevel: nisLevelEnum("nis_level").notNull(),
  avatarColor: text("avatar_color").notNull(),
  rating: numeric("rating", { precision: 3, scale: 1 }).notNull().default("0"),
  drillsPerWeek: integer("drills_per_week").notNull().default(0),
  ...timestamps,
});

export const staff = peopleSchema.table("staff", {
  id: primaryId(),
  academyId: uuid("academy_id").notNull(),
  userId: uuid("user_id"),
  fullName: text("full_name").notNull(),
  roleTitle: text("role_title").notNull(),
  employmentType: employmentTypeEnum("employment_type").notNull().default("full_time"),
  monthlySalaryPaise: integer("monthly_salary_paise").notNull(),
  avatarColor: text("avatar_color").notNull(),
  ...timestamps,
});
