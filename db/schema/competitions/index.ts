import { integer, pgEnum, pgSchema, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { primaryId, timestamps } from "../_shared";

export const competitionsSchema = pgSchema("competitions");

export const teamMemberRoleEnum = pgEnum("team_member_role", ["captain", "member"]);
export const selectionStatusEnum = pgEnum("selection_status", ["selected", "standby", "not_selected"]);
export const matchResultEnum = pgEnum("match_result", ["W", "L"]);
export const tournamentStatusEnum = pgEnum("tournament_status", [
  "draft",
  "live",
  "completed",
  "cancelled",
]);
export const matchStatusEnum = pgEnum("match_status", ["scheduled", "live", "completed"]);

export const teams = competitionsSchema.table("teams", {
  id: primaryId(),
  academyId: uuid("academy_id").notNull(),
  sportId: uuid("sport_id").notNull(),
  name: text("name").notNull(),
  coachId: uuid("coach_id"),
  weightClass: text("weight_class"),
  color: text("color"),
  ...timestamps,
});

export const teamMembers = competitionsSchema.table("team_members", {
  id: primaryId(),
  teamId: uuid("team_id").notNull(),
  playerId: uuid("player_id").notNull(),
  role: teamMemberRoleEnum("role").notNull().default("member"),
  selectionStatus: selectionStatusEnum("selection_status").notNull().default("selected"),
  ...timestamps,
});

export const teamMemberResults = competitionsSchema.table("team_member_results", {
  id: primaryId(),
  teamMemberId: uuid("team_member_id").notNull(),
  result: matchResultEnum("result").notNull(),
  sequence: integer("sequence").notNull(),
  ...timestamps,
});

export const tournaments = competitionsSchema.table("tournaments", {
  id: primaryId(),
  academyId: uuid("academy_id").notNull(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }).notNull(),
  status: tournamentStatusEnum("status").notNull().default("draft"),
  sportId: uuid("sport_id").notNull(),
  weightClass: text("weight_class"),
  participantAcademies: integer("participant_academies"),
  participantAthletes: integer("participant_athletes"),
  ...timestamps,
});

export const tournamentMatches = competitionsSchema.table("tournament_matches", {
  id: primaryId(),
  tournamentId: uuid("tournament_id").notNull(),
  round: text("round").notNull(),
  bracketPosition: integer("bracket_position").notNull(),
  matLabel: text("mat_label"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  playerAId: uuid("player_a_id"),
  playerBId: uuid("player_b_id"),
  playerAName: text("player_a_name"),
  playerBName: text("player_b_name"),
  scoreA: integer("score_a"),
  scoreB: integer("score_b"),
  winnerPlayerId: uuid("winner_player_id"),
  status: matchStatusEnum("status").notNull().default("scheduled"),
  ...timestamps,
});
