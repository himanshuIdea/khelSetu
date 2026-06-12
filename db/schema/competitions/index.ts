import {
  integer,
  jsonb,
  pgEnum,
  pgSchema,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { academies, sports } from "../academy";
import { coaches, players } from "../people";
import { primaryId, timestamps } from "../_shared";

export const competitionsSchema = pgSchema("competitions");

export const teamMemberRoleEnum = pgEnum("team_member_role", ["captain", "member"]);
export const selectionStatusEnum = pgEnum("selection_status", [
  "selected",
  "standby",
  "not_selected",
]);
export const matchResultEnum = pgEnum("match_result", ["W", "L"]);
export const tournamentStatusEnum = pgEnum("tournament_status", [
  "draft",
  "live",
  "completed",
  "cancelled",
]);
export const matchStatusEnum = pgEnum("match_status", ["scheduled", "live", "completed"]);
export const fixtureStatusEnum = pgEnum("fixture_status", ["scheduled", "completed", "cancelled"]);
export const medalTypeEnum = pgEnum("medal_type", ["gold", "silver", "bronze"]);

export const teams = competitionsSchema.table("teams", {
  id: primaryId(),
  academyId: uuid("academy_id")
    .notNull()
    .references(() => academies.id),
  sportId: uuid("sport_id")
    .notNull()
    .references(() => sports.id),
  name: text("name").notNull(),
  coachId: uuid("coach_id").references(() => coaches.id),
  weightClass: text("weight_class"),
  color: text("color"),
  ...timestamps,
});

export const teamMembers = competitionsSchema.table("team_members", {
  id: primaryId(),
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id),
  playerId: uuid("player_id")
    .notNull()
    .references(() => players.id),
  role: teamMemberRoleEnum("role").notNull().default("member"),
  selectionStatus: selectionStatusEnum("selection_status").notNull().default("selected"),
  ...timestamps,
});

export const teamMemberResults = competitionsSchema.table("team_member_results", {
  id: primaryId(),
  teamMemberId: uuid("team_member_id")
    .notNull()
    .references(() => teamMembers.id),
  result: matchResultEnum("result").notNull(),
  sequence: integer("sequence").notNull(),
  ...timestamps,
});

/** Upcoming fixtures shown on the Teams page. */
export const teamFixtures = competitionsSchema.table("team_fixtures", {
  id: primaryId(),
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id),
  tournamentId: uuid("tournament_id"),
  opponentName: text("opponent_name").notNull(),
  venue: text("venue").notNull(),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  status: fixtureStatusEnum("status").notNull().default("scheduled"),
  ...timestamps,
});

/** AI/rule-based line-up suggestions for tournaments. */
export const lineupSuggestions = competitionsSchema.table("lineup_suggestions", {
  id: primaryId(),
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id),
  tournamentId: uuid("tournament_id"),
  title: text("title").notNull(),
  suggestedPlayerIds: jsonb("suggested_player_ids").notNull().$type<string[]>(),
  rationale: text("rationale"),
  ...timestamps,
});

export const tournaments = competitionsSchema.table("tournaments", {
  id: primaryId(),
  academyId: uuid("academy_id")
    .notNull()
    .references(() => academies.id),
  name: text("name").notNull(),
  location: text("location").notNull(),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }).notNull(),
  status: tournamentStatusEnum("status").notNull().default("draft"),
  sportId: uuid("sport_id")
    .notNull()
    .references(() => sports.id),
  weightClass: text("weight_class"),
  participantAcademies: integer("participant_academies"),
  participantAthletes: integer("participant_athletes"),
  ...timestamps,
});

export const tournamentMatches = competitionsSchema.table("tournament_matches", {
  id: primaryId(),
  tournamentId: uuid("tournament_id")
    .notNull()
    .references(() => tournaments.id),
  round: text("round").notNull(),
  bracketPosition: integer("bracket_position").notNull(),
  matLabel: text("mat_label"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  playerAId: uuid("player_a_id").references(() => players.id),
  playerBId: uuid("player_b_id").references(() => players.id),
  playerAName: text("player_a_name"),
  playerBName: text("player_b_name"),
  scoreA: integer("score_a"),
  scoreB: integer("score_b"),
  winnerPlayerId: uuid("winner_player_id").references(() => players.id),
  nextMatchId: uuid("next_match_id"),
  medalType: medalTypeEnum("medal_type"),
  status: matchStatusEnum("status").notNull().default("scheduled"),
  ...timestamps,
});

/** Medal tally for tournament side panels. */
export const tournamentMedals = competitionsSchema.table(
  "tournament_medals",
  {
    id: primaryId(),
    tournamentId: uuid("tournament_id")
      .notNull()
      .references(() => tournaments.id),
    academyId: uuid("academy_id")
      .notNull()
      .references(() => academies.id),
    gold: integer("gold").notNull().default(0),
    silver: integer("silver").notNull().default(0),
    bronze: integer("bronze").notNull().default(0),
    ...timestamps,
  },
  (table) => [uniqueIndex("tournament_medals_tournament_idx").on(table.tournamentId)]
);
