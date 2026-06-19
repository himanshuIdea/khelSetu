import {
  boolean,
  integer,
  numeric,
  pgEnum,
  pgSchema,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { academies, batches, sports } from "../academy";
import { users } from "../identity";
import { primaryId, timestamps } from "../_shared";

export const peopleSchema = pgSchema("people");

export const playerStatusEnum = pgEnum("player_status", ["active", "on_hold", "inactive"]);
export const scoutingStatusEnum = pgEnum("scouting_status", [
  "khelo_india",
  "shortlisted_for_nationals",
  "shortlisted_for_states",
  "in_trials",
  "not_selected",
  "watchlist",
]);
export const nisLevelEnum = pgEnum("nis_level", ["nis_level_1", "nis_level_2", "in_review"]);
export const employmentTypeEnum = pgEnum("employment_type", ["full_time", "part_time"]);

export const staff = peopleSchema.table("staff", {
  id: primaryId(),
  academyId: uuid("academy_id")
    .notNull()
    .references(() => academies.id),
  userId: uuid("user_id"),
  fullName: text("full_name").notNull(),
  roleTitle: text("role_title").notNull(),
  employmentType: employmentTypeEnum("employment_type").notNull().default("full_time"),
  monthlySalaryPaise: integer("monthly_salary_paise").notNull(),
  avatarColor: text("avatar_color").notNull(),
  ...timestamps,
});

export const coaches = peopleSchema.table("coaches", {
  id: primaryId(),
  academyId: uuid("academy_id")
    .notNull()
    .references(() => academies.id),
  userId: uuid("user_id"),
  staffId: uuid("staff_id").references(() => staff.id),
  fullName: text("full_name").notNull(),
  sportId: uuid("sport_id")
    .notNull()
    .references(() => sports.id),
  roleTitle: text("role_title").notNull(),
  nisLevel: nisLevelEnum("nis_level").notNull(),
  avatarColor: text("avatar_color").notNull(),
  rating: numeric("rating", { precision: 3, scale: 1 }).notNull().default("0"),
  drillsPerWeek: integer("drills_per_week").notNull().default(0),
  ...timestamps,
});

export const players = peopleSchema.table(
  "players",
  {
    id: primaryId(),
    academyId: uuid("academy_id")
      .notNull()
      .references(() => academies.id),
    userId: uuid("user_id").references(() => users.id),
    externalId: text("external_id").notNull(),
    fullName: text("full_name").notNull(),
    sportId: uuid("sport_id")
      .notNull()
      .references(() => sports.id),
    batchId: uuid("batch_id").references(() => batches.id),
    primaryCoachId: uuid("primary_coach_id").references(() => coaches.id),
    dateOfBirth: timestamp("date_of_birth", { withTimezone: true }),
    weightCategory: text("weight_category"),
    heightCategory: text("height_category"),
    status: playerStatusEnum("status").notNull().default("active"),
    avatarColor: text("avatar_color").notNull(),
    rating: numeric("rating", { precision: 3, scale: 1 }),
    monthlyFeePaise: integer("monthly_fee_paise"),
    notes: text("notes"),
    joinedAt: timestamp("joined_at", { withTimezone: true }),
    scoutingStatus: scoutingStatusEnum("scouting_status"),
    scoutingStatusSetAt: timestamp("scouting_status_set_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("players_academy_external_id_idx").on(table.academyId, table.externalId),
  ]
);

/** Coach assignment history — supports future rotation and audit. */
export const playerCoachAssignments = peopleSchema.table(
  "player_coach_assignments",
  {
    id: primaryId(),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id),
    coachId: uuid("coach_id")
      .notNull()
      .references(() => coaches.id),
    batchId: uuid("batch_id").references(() => batches.id),
    isPrimary: boolean("is_primary").notNull().default(false),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("player_coach_assignments_player_coach_idx").on(table.playerId, table.coachId),
  ]
);
