import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  coaches,
  players,
  teamMemberResults,
  teamMembers,
  teams,
} from "@/db/schema";
import { getInitials } from "@/lib/format";
import type { OtherTeam, TeamMember } from "./types";

export async function getFeaturedTeam(academyId: string) {
  const [team] = await db
    .select({
      team: teams,
      coachName: coaches.fullName,
      memberCount: sql<number>`(
        select count(*) from competitions.team_members tm where tm.team_id = ${teams.id}
      )`,
    })
    .from(teams)
    .leftJoin(coaches, eq(teams.coachId, coaches.id))
    .where(eq(teams.academyId, academyId))
    .orderBy(sql`${teams.createdAt} asc`)
    .limit(1);

  if (!team) return null;

  const members = await db
    .select({ initials: players.fullName, color: players.avatarColor })
    .from(teamMembers)
    .innerJoin(players, eq(teamMembers.playerId, players.id))
    .where(eq(teamMembers.teamId, team.team.id))
    .limit(4);

  return {
    id: team.team.id,
    name: team.team.name,
    coach: team.coachName ?? "—",
    createdAt: team.team.createdAt,
    memberCount: Number(team.memberCount),
    avatars: members.map((m) => ({
      initials: getInitials(m.initials),
      color: m.color,
    })),
  };
}

export async function getTeamMembers(academyId: string, teamId?: string): Promise<TeamMember[]> {
  let targetTeamId = teamId;

  if (!targetTeamId) {
    const [team] = await db
      .select({ id: teams.id })
      .from(teams)
      .where(eq(teams.academyId, academyId))
      .orderBy(sql`${teams.createdAt} asc`)
      .limit(1);
    targetTeamId = team?.id;
  }

  if (!targetTeamId) return [];

  const rows = await db
    .select({
      member: teamMembers,
      player: players,
      results: sql<string[]>`coalesce(
        array_agg(${teamMemberResults.result} order by ${teamMemberResults.sequence}),
        '{}'
      )`,
    })
    .from(teamMembers)
    .innerJoin(players, eq(teamMembers.playerId, players.id))
    .leftJoin(teamMemberResults, eq(teamMemberResults.teamMemberId, teamMembers.id))
    .where(eq(teamMembers.teamId, targetTeamId))
    .groupBy(teamMembers.id, players.id);

  return rows.map((row) => ({
    initials: getInitials(row.player.fullName),
    name: row.player.fullName,
    weight: row.player.weightCategory ?? "—",
    role: row.member.role === "captain" ? "Captain" : "Member",
    roleVariant: row.member.role === "captain" ? "brand" : "grey",
    form: row.results ?? [],
    selection:
      row.member.selectionStatus === "selected"
        ? "Selected"
        : row.member.selectionStatus === "standby"
          ? "Standby"
          : "Not selected",
    selectionVariant: row.member.selectionStatus === "standby" ? "amber" : "green",
    avatarColor: row.player.avatarColor,
  }));
}

export async function getOtherTeams(academyId: string, excludeTeamId?: string): Promise<OtherTeam[]> {
  const conditions = excludeTeamId
    ? and(eq(teams.academyId, academyId), ne(teams.id, excludeTeamId))
    : eq(teams.academyId, academyId);

  const rows = await db
    .select({
      team: teams,
      coachName: coaches.fullName,
      memberCount: sql<number>`(
        select count(*) from competitions.team_members tm where tm.team_id = ${teams.id}
      )`,
    })
    .from(teams)
    .leftJoin(coaches, eq(teams.coachId, coaches.id))
    .where(conditions)
    .orderBy(sql`${teams.createdAt} asc`);

  return rows.map((row) => ({
    initials: row.team.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2),
    name: row.team.name,
    meta: `Coach ${row.coachName?.split(" ")[0] ?? "—"} · ${row.memberCount} members`,
    color: row.team.color ?? "#7C5CFC",
  }));
}
