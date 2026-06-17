import { and, eq, inArray, ne, notInArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  academySports,
  batches,
  coaches,
  lineupSuggestions,
  players,
  sports,
  teamFixtures,
  teamMemberResults,
  teamMembers,
  teams,
} from "@/db/schema";
import type {
  AddTeamMembersPayload,
  CreateTeamPayload,
  TeamFormOptions,
  TeamMemberFormOptions,
} from "@/lib/teams";
import { formatWeightKg, getInitials } from "@/lib/format";
import type {
  OtherTeam,
  TeamDetail,
  TeamMember,
  TeamMemberRole,
  TeamMemberSelectionStatus,
} from "./types";

function normalizeFormResults(results: (string | null)[] | null | undefined): string[] {
  return (results ?? []).flatMap((result) => {
    if (result == null || result === "" || result.toLowerCase() === "null") return [];
    return [result];
  });
}

function mapSelectionStatus(status: TeamMemberSelectionStatus) {
  if (status === "selected") {
    return { selection: "Selected", selectionVariant: "green" as const };
  }
  if (status === "standby") {
    return { selection: "Standby", selectionVariant: "amber" as const };
  }
  return { selection: "Not selected", selectionVariant: "grey" as const };
}

export async function getTeamById(academyId: string, teamId: string): Promise<TeamDetail | null> {
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
    .where(and(eq(teams.academyId, academyId), eq(teams.id, teamId)))
    .limit(1);

  if (!team) return null;

  const [fixture] = await db
    .select()
    .from(teamFixtures)
    .where(and(eq(teamFixtures.teamId, team.team.id), eq(teamFixtures.status, "scheduled")))
    .orderBy(teamFixtures.scheduledAt)
    .limit(1);

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
    nextFixture: fixture
      ? {
          title: fixture.opponentName,
          venue: fixture.venue,
          scheduledAt: fixture.scheduledAt,
        }
      : null,
  };
}

export async function getFeaturedTeam(academyId: string) {
  const [team] = await db
    .select({ id: teams.id })
    .from(teams)
    .where(eq(teams.academyId, academyId))
    .orderBy(sql`${teams.createdAt} asc`)
    .limit(1);

  if (!team) return null;
  return getTeamById(academyId, team.id);
}

export async function resolveActiveTeam(academyId: string, teamId?: string | null) {
  if (teamId) {
    const team = await getTeamById(academyId, teamId);
    if (team) return team;
  }
  return getFeaturedTeam(academyId);
}

export async function getLineupSuggestion(academyId: string, teamId?: string) {
  let targetTeamId = teamId;

  if (!targetTeamId) {
    const featured = await getFeaturedTeam(academyId);
    targetTeamId = featured?.id;
  }

  if (!targetTeamId) return null;

  const [suggestion] = await db
    .select()
    .from(lineupSuggestions)
    .where(eq(lineupSuggestions.teamId, targetTeamId))
    .orderBy(sql`${lineupSuggestions.createdAt} desc`)
    .limit(1);

  if (!suggestion) return null;

  const playerIds = suggestion.suggestedPlayerIds;
  const roster =
    playerIds.length > 0
      ? await db
          .select({ fullName: players.fullName })
          .from(players)
          .where(inArray(players.id, playerIds))
      : [];

  return {
    title: suggestion.title,
    athleteCount: playerIds.length,
    rationale: suggestion.rationale,
    athletes: roster.map((row) => row.fullName),
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
        array_agg(${teamMemberResults.result} order by ${teamMemberResults.sequence})
        filter (where ${teamMemberResults.result} is not null),
        '{}'
      )`,
    })
    .from(teamMembers)
    .innerJoin(players, eq(teamMembers.playerId, players.id))
    .leftJoin(teamMemberResults, eq(teamMemberResults.teamMemberId, teamMembers.id))
    .where(eq(teamMembers.teamId, targetTeamId))
    .groupBy(teamMembers.id, players.id);

  return rows.map((row) => {
    const selection = mapSelectionStatus(row.member.selectionStatus);

    return {
      playerId: row.player.id,
      initials: getInitials(row.player.fullName),
      name: row.player.fullName,
      weight: formatWeightKg(row.player.weightCategory),
      role: row.member.role === "captain" ? "Captain" : "Member",
      roleValue: row.member.role,
      roleVariant: row.member.role === "captain" ? "brand" : "grey",
      form: normalizeFormResults(row.results),
      selection: selection.selection,
      selectionVariant: selection.selectionVariant,
      selectionStatus: row.member.selectionStatus,
      avatarColor: row.player.avatarColor,
    };
  });
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
    id: row.team.id,
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

export async function getTeamFormOptions(academyId: string): Promise<TeamFormOptions> {
  const [sportRows, coachRows] = await Promise.all([
    db
      .select({ id: sports.id, name: sports.name })
      .from(academySports)
      .innerJoin(sports, eq(academySports.sportId, sports.id))
      .where(eq(academySports.academyId, academyId)),
    db
      .select({ id: coaches.id, name: coaches.fullName, sportId: coaches.sportId })
      .from(coaches)
      .where(eq(coaches.academyId, academyId)),
  ]);

  return { sports: sportRows, coaches: coachRows };
}

export async function createTeam(academyId: string, payload: CreateTeamPayload) {
  const [sport] = await db
    .select({ id: sports.id, name: sports.name, color: sports.color })
    .from(sports)
    .innerJoin(academySports, eq(academySports.sportId, sports.id))
    .where(and(eq(academySports.academyId, academyId), eq(sports.id, payload.sportId)))
    .limit(1);

  if (!sport) {
    throw new Error("Selected sport is not offered by this academy.");
  }

  if (payload.coachId) {
    const [coach] = await db
      .select({ id: coaches.id })
      .from(coaches)
      .where(
        and(
          eq(coaches.id, payload.coachId),
          eq(coaches.academyId, academyId),
          eq(coaches.sportId, payload.sportId)
        )
      )
      .limit(1);

    if (!coach) {
      throw new Error("Selected coach is invalid for this sport.");
    }
  }

  const [team] = await db
    .insert(teams)
    .values({
      academyId,
      sportId: payload.sportId,
      name: payload.name.trim(),
      coachId: payload.coachId ?? null,
      weightClass: payload.weightClass?.trim() || null,
      color: sport.color,
    })
    .returning({ id: teams.id, name: teams.name });

  return team;
}

export async function getTeamMemberFormOptions(
  academyId: string,
  teamId: string
): Promise<TeamMemberFormOptions> {
  const [team] = await db
    .select({ sportId: teams.sportId })
    .from(teams)
    .where(and(eq(teams.id, teamId), eq(teams.academyId, academyId)))
    .limit(1);

  if (!team) {
    throw new Error("Team not found.");
  }

  const existingMembers = await db
    .select({ playerId: teamMembers.playerId })
    .from(teamMembers)
    .where(eq(teamMembers.teamId, teamId));

  const excludeIds = existingMembers.map((row) => row.playerId);

  const baseConditions = and(
    eq(players.academyId, academyId),
    eq(players.sportId, team.sportId),
    ne(players.status, "inactive")
  );

  const rows = await db
    .select({
      id: players.id,
      name: players.fullName,
      weight: players.weightCategory,
      batchName: batches.name,
      avatarColor: players.avatarColor,
    })
    .from(players)
    .leftJoin(batches, eq(players.batchId, batches.id))
    .where(
      excludeIds.length > 0
        ? and(baseConditions, notInArray(players.id, excludeIds))
        : baseConditions
    )
    .orderBy(players.fullName);

  return {
    players: rows.map((row) => ({
      id: row.id,
      name: row.name,
      weight: formatWeightKg(row.weight),
      batch: row.batchName ?? "—",
      avatarColor: row.avatarColor,
    })),
  };
}

export async function addTeamMembers(
  academyId: string,
  teamId: string,
  payload: AddTeamMembersPayload
) {
  const playerIds = [...new Set(payload.playerIds)];

  const [team] = await db
    .select({ id: teams.id, sportId: teams.sportId })
    .from(teams)
    .where(and(eq(teams.id, teamId), eq(teams.academyId, academyId)))
    .limit(1);

  if (!team) {
    throw new Error("Team not found.");
  }

  const validPlayers = await db
    .select({ id: players.id })
    .from(players)
    .where(
      and(
        inArray(players.id, playerIds),
        eq(players.academyId, academyId),
        eq(players.sportId, team.sportId),
        ne(players.status, "inactive")
      )
    );

  if (validPlayers.length !== playerIds.length) {
    throw new Error("One or more selected players are invalid for this team.");
  }

  const existing = await db
    .select({ playerId: teamMembers.playerId })
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), inArray(teamMembers.playerId, playerIds)));

  const existingIds = new Set(existing.map((row) => row.playerId));
  const toAdd = playerIds.filter((id) => !existingIds.has(id));

  if (toAdd.length === 0) {
    throw new Error("Selected players are already on this team.");
  }

  const inserted = await db
    .insert(teamMembers)
    .values(toAdd.map((playerId) => ({ teamId, playerId })))
    .returning({ id: teamMembers.id });

  return { added: inserted.length };
}

async function getTeamMemberForAcademy(
  academyId: string,
  teamId: string,
  playerId: string
) {
  const [row] = await db
    .select({ member: teamMembers })
    .from(teamMembers)
    .innerJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(
      and(
        eq(teams.academyId, academyId),
        eq(teams.id, teamId),
        eq(teamMembers.playerId, playerId)
      )
    )
    .limit(1);

  return row?.member ?? null;
}

export async function removeTeamMember(academyId: string, teamId: string, playerId: string) {
  const member = await getTeamMemberForAcademy(academyId, teamId, playerId);

  if (!member) {
    throw new Error("Team member not found.");
  }

  await db.delete(teamMemberResults).where(eq(teamMemberResults.teamMemberId, member.id));
  await db.delete(teamMembers).where(eq(teamMembers.id, member.id));

  return { removed: true };
}

export async function updateTeamMemberSelection(
  academyId: string,
  teamId: string,
  playerId: string,
  selectionStatus: TeamMemberSelectionStatus
) {
  const member = await getTeamMemberForAcademy(academyId, teamId, playerId);

  if (!member) {
    throw new Error("Team member not found.");
  }

  const [updated] = await db
    .update(teamMembers)
    .set({ selectionStatus })
    .where(eq(teamMembers.id, member.id))
    .returning({ selectionStatus: teamMembers.selectionStatus });

  if (!updated) {
    throw new Error("Could not update team member.");
  }

  return { selectionStatus: updated.selectionStatus };
}

export async function updateTeamMemberRole(
  academyId: string,
  teamId: string,
  playerId: string,
  role: TeamMemberRole
) {
  const member = await getTeamMemberForAcademy(academyId, teamId, playerId);

  if (!member) {
    throw new Error("Team member not found.");
  }

  if (role === "captain") {
    await db.transaction(async (tx) => {
      await tx
        .update(teamMembers)
        .set({ role: "member" })
        .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.role, "captain")));

      await tx.update(teamMembers).set({ role: "captain" }).where(eq(teamMembers.id, member.id));
    });
  } else {
    await db.update(teamMembers).set({ role: "member" }).where(eq(teamMembers.id, member.id));
  }

  return { role };
}

export async function assertCoachOwnsTeam(
  academyId: string,
  coachId: string,
  teamId: string
): Promise<void> {
  const [team] = await db
    .select({ coachId: teams.coachId })
    .from(teams)
    .where(and(eq(teams.academyId, academyId), eq(teams.id, teamId)))
    .limit(1);

  if (!team) {
    throw new Error("Team not found.");
  }

  if (team.coachId !== coachId) {
    throw new Error("You can only manage teams you coach.");
  }
}

export async function getCoachFeaturedTeam(academyId: string, coachId: string) {
  const [team] = await db
    .select({ id: teams.id })
    .from(teams)
    .where(and(eq(teams.academyId, academyId), eq(teams.coachId, coachId)))
    .orderBy(sql`${teams.createdAt} asc`)
    .limit(1);

  if (!team) return null;
  return getTeamById(academyId, team.id);
}

export async function resolveActiveCoachTeam(
  academyId: string,
  coachId: string,
  teamId?: string | null
) {
  if (teamId) {
    const team = await getTeamById(academyId, teamId);
    if (team) {
      const [owned] = await db
        .select({ id: teams.id })
        .from(teams)
        .where(
          and(eq(teams.academyId, academyId), eq(teams.id, teamId), eq(teams.coachId, coachId))
        )
        .limit(1);
      if (owned) return team;
    }
  }
  return getCoachFeaturedTeam(academyId, coachId);
}

export async function getCoachOtherTeams(
  academyId: string,
  coachId: string,
  excludeTeamId?: string
): Promise<OtherTeam[]> {
  const conditions = excludeTeamId
    ? and(
        eq(teams.academyId, academyId),
        eq(teams.coachId, coachId),
        ne(teams.id, excludeTeamId)
      )
    : and(eq(teams.academyId, academyId), eq(teams.coachId, coachId));

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
    id: row.team.id,
    initials: row.team.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2),
    name: row.team.name,
    meta: `Coach ${row.coachName?.split(" ")[0] ?? "—"} · ${Number(row.memberCount)} members`,
    color: row.team.color ?? "#7C5CFC",
  }));
}

export async function getCoachTeamFormOptions(
  academyId: string,
  coachId: string
): Promise<TeamFormOptions> {
  const { listCoachAssignments } = await import("@/lib/repositories/coaches");
  const assignments = await listCoachAssignments(academyId, coachId);
  const coach = await db
    .select({ fullName: coaches.fullName, sportId: coaches.sportId })
    .from(coaches)
    .where(and(eq(coaches.id, coachId), eq(coaches.academyId, academyId)))
    .limit(1)
    .then((rows) => rows[0]);

  const sportMap = new Map<string, string>();
  for (const group of assignments) {
    sportMap.set(group.sportId, group.sportName);
  }

  const sports = [...sportMap.entries()].map(([id, name]) => ({ id, name }));

  return {
    sports,
    coaches: coach
      ? [{ id: coachId, name: coach.fullName, sportId: coach.sportId }]
      : [],
  };
}

export async function getCoachTeamMemberFormOptions(
  academyId: string,
  coachId: string,
  teamId: string
): Promise<TeamMemberFormOptions> {
  const [team] = await db
    .select({ sportId: teams.sportId })
    .from(teams)
    .where(and(eq(teams.id, teamId), eq(teams.academyId, academyId), eq(teams.coachId, coachId)))
    .limit(1);

  if (!team) {
    return { players: [] };
  }

  const { getCoachAssignedBatchIds } = await import("@/lib/repositories/coaches");
  const batchIds = await getCoachAssignedBatchIds(academyId, coachId);

  if (batchIds.length === 0) {
    return { players: [] };
  }

  const roster = await db
    .select({
      id: players.id,
      name: players.fullName,
      weight: players.weightCategory,
      batchName: batches.name,
      avatarColor: players.avatarColor,
    })
    .from(players)
    .innerJoin(batches, eq(players.batchId, batches.id))
    .where(
      and(
        eq(players.academyId, academyId),
        eq(players.sportId, team.sportId),
        inArray(players.batchId, batchIds),
        ne(players.status, "inactive")
      )
    )
    .orderBy(players.fullName);

  const onTeam = await db
    .select({ playerId: teamMembers.playerId })
    .from(teamMembers)
    .where(eq(teamMembers.teamId, teamId));

  const onTeamIds = new Set(onTeam.map((row) => row.playerId));

  return {
    players: roster
      .filter((player) => !onTeamIds.has(player.id))
      .map((player) => ({
        id: player.id,
        name: player.name,
        weight: formatWeightKg(player.weight),
        batch: player.batchName ?? "—",
        avatarColor: player.avatarColor,
      })),
  };
}

export async function assertCoachSportAssigned(
  academyId: string,
  coachId: string,
  sportId: string
): Promise<void> {
  const { listCoachAssignments } = await import("@/lib/repositories/coaches");
  const assignments = await listCoachAssignments(academyId, coachId);
  const hasSport = assignments.some((group) => group.sportId === sportId);
  if (!hasSport) {
    throw new Error("You are not assigned to this sport.");
  }
}
