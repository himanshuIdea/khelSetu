import {
  integer,
  jsonb,
  numeric,
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
export const participationScopeEnum = pgEnum("participation_scope", [
  "intra_academy",
  "inter_academy",
]);
export const competitionFormatEnum = pgEnum("competition_format", [
  "knockout",
  "double_elimination",
  "round_robin",
  "pool_knockout",
  "heats",
  "trial",
]);
export const ageDivisionEnum = pgEnum("age_division", ["sub_junior", "junior", "senior"]);

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
  participationScope: participationScopeEnum("participation_scope")
    .notNull()
    .default("intra_academy"),
  competitionFormat: competitionFormatEnum("competition_format")
    .notNull()
    .default("knockout"),
  ageDivision: ageDivisionEnum("age_division").notNull().default("senior"),
  description: text("description"),
  participantAcademies: integer("participant_academies"),
  participantAthletes: integer("participant_athletes"),
  ...timestamps,
});

export const tournamentPools = competitionsSchema.table("tournament_pools", {
  id: primaryId(),
  tournamentId: uuid("tournament_id")
    .notNull()
    .references(() => tournaments.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
});

export const tournamentParticipants = competitionsSchema.table(
  "tournament_participants",
  {
    id: primaryId(),
    tournamentId: uuid("tournament_id")
      .notNull()
      .references(() => tournaments.id, { onDelete: "cascade" }),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id),
    academyId: uuid("academy_id")
      .notNull()
      .references(() => academies.id),
    seedOrder: integer("seed_order"),
    poolId: uuid("pool_id").references(() => tournamentPools.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("tournament_participants_tournament_player_idx").on(
      table.tournamentId,
      table.playerId
    ),
  ]
);

export const tournamentStandings = competitionsSchema.table(
  "tournament_standings",
  {
    id: primaryId(),
    poolId: uuid("pool_id")
      .notNull()
      .references(() => tournamentPools.id, { onDelete: "cascade" }),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id),
    played: integer("played").notNull().default(0),
    won: integer("won").notNull().default(0),
    lost: integer("lost").notNull().default(0),
    points: integer("points").notNull().default(0),
    rank: integer("rank"),
    resultValue: numeric("result_value", { precision: 10, scale: 3 }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("tournament_standings_pool_player_idx").on(table.poolId, table.playerId),
  ]
);

export const tournamentMatches = competitionsSchema.table("tournament_matches", {
  id: primaryId(),
  tournamentId: uuid("tournament_id")
    .notNull()
    .references(() => tournaments.id),
  round: text("round").notNull(),
  bracketPosition: integer("bracket_position").notNull(),
  matchLabel: text("match_label"),
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
  loserNextMatchId: uuid("loser_next_match_id"),
  poolId: uuid("pool_id").references(() => tournamentPools.id, { onDelete: "set null" }),
  heatNumber: integer("heat_number"),
  laneNumber: integer("lane_number"),
  groupLabel: text("group_label"),
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
