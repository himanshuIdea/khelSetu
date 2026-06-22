import { and, eq, inArray, isNull, ne, sql } from "drizzle-orm";
import {
  academies,
  batches,
  players,
  sports,
  tournamentMatches,
  tournamentMedals,
  tournamentParticipants,
  tournamentPools,
  tournamentStandings,
  tournaments,
} from "@/db/schema";
import { db } from "@/lib/db";
import { formatSportWeightLine, getInitials } from "@/lib/format";
import type {
  AgeDivision,
  CompetitionFormat,
  CreateTournamentPayload,
  EligibleTournamentPlayer,
  InterAcademyOption,
  ParticipationScope,
  TournamentParticipantRow,
  TournamentScheduleMatch,
  TournamentStandingRow,
  UpdateTournamentMatchPayload,
  UpdateTournamentMedalsPayload,
} from "@/lib/tournaments";
import {
  ageDivisionToBatchName,
  normalizeWeightKg,
  weightsMatch,
} from "@/lib/tournaments";
import {
  buildMatchLabel,
  defaultMatLabel,
  resolveMatchDisplayLabel,
} from "@/lib/tournament-match-labels";
import { isOpenAthleteSlot, isPlaceholderAthleteName } from "@/lib/tournament-match-slots";

type ParticipantSeed = {
  playerId: string;
  academyId: string;
  playerName: string;
  seedOrder: number;
};

function matchInsertMeta(
  format: CompetitionFormat,
  params: {
    round: string;
    bracketPosition: number;
    poolName?: string;
    heatNumber?: number | null;
    laneNumber?: number | null;
    groupLabel?: string | null;
  }
) {
  const matchLabel = buildMatchLabel({ format, ...params });
  return {
    matchLabel,
    matLabel: defaultMatLabel(matchLabel),
  };
}

function boutSummary(row: {
  matchLabel?: string | null;
  round: string;
  bracketPosition: number;
  playerAName: string | null;
  playerBName: string | null;
  heatNumber?: number | null;
  laneNumber?: number | null;
  groupLabel?: string | null;
}): string {
  const label = resolveMatchDisplayLabel(row);
  if (row.playerAName && row.playerBName) {
    return `${label} · ${row.playerAName} vs ${row.playerBName}`;
  }
  return label;
}

function nextPowerOfTwo(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

function firstRoundLabel(matchCount: number): string {
  if (matchCount <= 1) return "Final";
  if (matchCount === 2) return "SF";
  return "QF";
}

export type ActiveTournament = {
  id: string;
  name: string;
  location: string;
  startDate: Date;
  endDate: Date;
  participantAcademies: number;
  participantAthletes: number;
  weightClass: string;
  status: string;
  sportId: string;
  sportName: string;
  participationScope: ParticipationScope;
  competitionFormat: CompetitionFormat;
  ageDivision: AgeDivision;
  description: string | null;
};

function formatPlayerAttendanceRate(present: unknown, total: unknown): string {
  const totalN = Number(total);
  const presentN = Number(present);
  if (!Number.isFinite(totalN) || !Number.isFinite(presentN) || totalN <= 0) return "—";
  return `${Math.round((presentN / totalN) * 100)}%`;
}

export async function getActiveTournament(academyId: string): Promise<ActiveTournament | null> {
  const [row] = await db
    .select({
      tournament: tournaments,
      sportName: sports.name,
    })
    .from(tournaments)
    .innerJoin(sports, eq(tournaments.sportId, sports.id))
    .where(and(eq(tournaments.academyId, academyId), eq(tournaments.status, "live")))
    .limit(1);

  if (!row) return null;

  const t = row.tournament;
  return {
    id: t.id,
    name: t.name,
    location: t.location,
    startDate: t.startDate,
    endDate: t.endDate,
    participantAcademies: t.participantAcademies ?? 0,
    participantAthletes: t.participantAthletes ?? 0,
    weightClass: t.weightClass ?? "",
    status: t.status,
    sportId: t.sportId,
    sportName: row.sportName,
    participationScope: t.participationScope,
    competitionFormat: t.competitionFormat,
    ageDivision: t.ageDivision,
    description: t.description,
  };
}

export async function getBracketMatches(tournamentId: string) {
  return db
    .select()
    .from(tournamentMatches)
    .where(eq(tournamentMatches.tournamentId, tournamentId))
    .orderBy(tournamentMatches.round, tournamentMatches.bracketPosition);
}

export async function getTournamentSchedule(
  tournamentId: string
): Promise<TournamentScheduleMatch[]> {
  const rows = await db
    .select()
    .from(tournamentMatches)
    .where(eq(tournamentMatches.tournamentId, tournamentId))
    .orderBy(
      sql`${tournamentMatches.scheduledAt} asc nulls last`,
      tournamentMatches.round,
      tournamentMatches.bracketPosition
    );

  return rows.map((row) => ({
    id: row.id,
    matchLabel: resolveMatchDisplayLabel(row),
    round: row.round,
    bracketPosition: row.bracketPosition,
    matLabel: row.matLabel,
    scheduledAt: row.scheduledAt?.toISOString() ?? null,
    status: row.status,
    playerAName: row.playerAName,
    playerBName: row.playerBName,
    playerAId: row.playerAId,
    playerBId: row.playerBId,
    winnerPlayerId: row.winnerPlayerId,
    scoreA: row.scoreA,
    scoreB: row.scoreB,
    heatNumber: row.heatNumber,
    laneNumber: row.laneNumber,
    poolId: row.poolId,
    groupLabel: row.groupLabel,
    boutSummary: boutSummary(row),
  }));
}

export async function getMatSchedule(tournamentId: string) {
  const rows = await getTournamentSchedule(tournamentId);
  return rows
    .filter((row) => row.matLabel || row.scheduledAt)
    .map((row) => {
      const variant =
        row.status === "live" ? "red" : row.status === "scheduled" ? "grey" : "amber";
      const time = row.scheduledAt
        ? new Date(row.scheduledAt).toLocaleTimeString("en-IN", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })
        : "—";
      return {
        mat: row.matLabel ?? "Mat 1",
        time,
        bout: row.boutSummary,
        variant: variant as "red" | "grey" | "amber",
      };
    });
}

export async function getTournamentMedals(tournamentId: string, academyId: string) {
  const [medals] = await db
    .select()
    .from(tournamentMedals)
    .where(
      and(eq(tournamentMedals.tournamentId, tournamentId), eq(tournamentMedals.academyId, academyId))
    )
    .limit(1);

  return {
    gold: medals?.gold ?? 0,
    silver: medals?.silver ?? 0,
    bronze: medals?.bronze ?? 0,
  };
}

export async function getActiveTournamentId(academyId: string) {
  const [tournament] = await db
    .select({ id: tournaments.id })
    .from(tournaments)
    .where(and(eq(tournaments.academyId, academyId), eq(tournaments.status, "live")))
    .limit(1);

  return tournament?.id ?? null;
}

export async function listInterAcademyOptions(hostAcademyId: string): Promise<InterAcademyOption[]> {
  const rows = await db
    .select({
      id: academies.id,
      name: academies.name,
      district: academies.district,
    })
    .from(academies)
    .where(and(isNull(academies.deletedAt), ne(academies.id, hostAcademyId)))
    .orderBy(academies.district, academies.name);

  return rows.map((row) => ({
    academyId: row.id,
    name: row.name,
    district: row.district,
    initials: getInitials(row.name),
  }));
}

function tournamentAcademyFilter(params: {
  academyId?: string;
  academyIds?: string[];
}) {
  if (params.academyIds?.length) {
    return inArray(players.academyId, params.academyIds);
  }
  if (params.academyId) {
    return eq(players.academyId, params.academyId);
  }
  return undefined;
}

function sortWeightClasses(weights: string[]): string[] {
  return [...weights].sort((a, b) => {
    const na = normalizeWeightKg(a);
    const nb = normalizeWeightKg(b);
    const numA = na ? Number.parseFloat(na) : Number.NaN;
    const numB = nb ? Number.parseFloat(nb) : Number.NaN;
    if (Number.isFinite(numA) && Number.isFinite(numB)) return numA - numB;
    if (Number.isFinite(numA)) return -1;
    if (Number.isFinite(numB)) return 1;
    return a.localeCompare(b);
  });
}

export async function listWeightClassesForDivision(params: {
  sportId: string;
  ageDivision: AgeDivision;
  academyId?: string;
  academyIds?: string[];
}): Promise<string[]> {
  const batchName = ageDivisionToBatchName(params.ageDivision);
  const academyFilter = tournamentAcademyFilter(params);
  if (!academyFilter) return [];

  const rows = await db
    .selectDistinct({ weightCategory: players.weightCategory })
    .from(players)
    .innerJoin(batches, eq(players.batchId, batches.id))
    .where(
      and(
        academyFilter,
        eq(players.sportId, params.sportId),
        inArray(players.status, ["active", "on_hold"]),
        eq(batches.name, batchName)
      )
    );

  const weights = rows
    .map((row) => row.weightCategory?.trim())
    .filter((value): value is string => Boolean(value));

  return sortWeightClasses([...new Set(weights)]);
}

export async function listEligibleTournamentPlayers(params: {
  sportId: string;
  ageDivision: AgeDivision;
  weightClass?: string | null;
  academyId?: string;
  academyIds?: string[];
}): Promise<EligibleTournamentPlayer[]> {
  const batchName = ageDivisionToBatchName(params.ageDivision);
  const academyFilter = tournamentAcademyFilter(params);

  if (!academyFilter) return [];

  const rows = await db
    .select({
      player: players,
      sportName: sports.name,
      batchName: batches.name,
      academyName: academies.name,
    })
    .from(players)
    .innerJoin(sports, eq(players.sportId, sports.id))
    .innerJoin(academies, eq(players.academyId, academies.id))
    .innerJoin(batches, eq(players.batchId, batches.id))
    .where(
      and(
        academyFilter,
        eq(players.sportId, params.sportId),
        inArray(players.status, ["active", "on_hold"]),
        eq(batches.name, batchName)
      )
    );

  const filtered = rows.filter((row) => {
    if (params.weightClass && !weightsMatch(row.player.weightCategory, params.weightClass)) {
      return false;
    }
    return true;
  });

  return filtered.map((row) => ({
    id: row.player.id,
    academyId: row.player.academyId,
    academyName: row.academyName,
    initials: getInitials(row.player.fullName),
    name: row.player.fullName,
    sport: formatSportWeightLine(`${row.sportName} · ${row.player.weightCategory ?? "—"}`),
    batch: row.batchName ?? batchName,
    weight: row.player.weightCategory ?? "—",
    rating: row.player.rating != null ? String(row.player.rating) : "—",
    attendance: "—",
    avatarColor: row.player.avatarColor,
  }));
}

export async function listEligiblePlayersForDivisionWithMeta(params: {
  sportId: string;
  ageDivision: AgeDivision;
  weightClass?: string | null;
  academyId?: string;
  academyIds?: string[];
}) {
  const [players, weightClasses] = await Promise.all([
    listEligibleTournamentPlayers(params),
    listWeightClassesForDivision(params),
  ]);

  return { players, weightClasses };
}

export async function getTournamentStandings(
  tournamentId: string
): Promise<TournamentStandingRow[]> {
  const rows = await db
    .select({
      standing: tournamentStandings,
      pool: tournamentPools,
      player: players,
      academy: academies,
    })
    .from(tournamentStandings)
    .innerJoin(tournamentPools, eq(tournamentStandings.poolId, tournamentPools.id))
    .innerJoin(players, eq(tournamentStandings.playerId, players.id))
    .innerJoin(academies, eq(players.academyId, academies.id))
    .where(eq(tournamentPools.tournamentId, tournamentId))
    .orderBy(tournamentPools.sortOrder, tournamentStandings.rank, tournamentStandings.points);

  return rows.map((row) => ({
    id: row.standing.id,
    poolId: row.pool.id,
    poolName: row.pool.name,
    playerId: row.player.id,
    playerName: row.player.fullName,
    academyName: row.academy.name,
    played: row.standing.played,
    won: row.standing.won,
    lost: row.standing.lost,
    points: row.standing.points,
    rank: row.standing.rank,
    resultValue: row.standing.resultValue != null ? String(row.standing.resultValue) : null,
    rating: row.player.rating != null ? String(row.player.rating) : null,
  }));
}

export async function listEligiblePlayersForDivision(params: {
  sportId: string;
  ageDivision: AgeDivision;
  weightClass?: string | null;
  academyId?: string;
  academyIds?: string[];
}) {
  return listEligibleTournamentPlayers(params);
}

async function generateKnockoutStructure(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  tournamentId: string,
  participants: ParticipantSeed[]
) {
  const count = participants.length;
  if (count < 2) return;

  const bracketSize = nextPowerOfTwo(count);
  const slots: (ParticipantSeed | null)[] = Array.from({ length: bracketSize }, (_, i) =>
    participants[i] ?? null
  );

  const roundCount = Math.log2(bracketSize);
  const roundNames: string[] = [];
  for (let level = roundCount; level >= 1; level -= 1) {
    roundNames.push(firstRoundLabel(2 ** (level - 1)));
  }

  let previousIds: string[] = [];

  for (let roundIndex = 0; roundIndex < roundNames.length; roundIndex += 1) {
    const roundName = roundNames[roundIndex];
    const matchCount = 2 ** (roundNames.length - roundIndex - 1);
    const currentIds: string[] = [];

    for (let position = 0; position < matchCount; position += 1) {
      let playerAId: string | null = null;
      let playerBId: string | null = null;
      let playerAName: string | null = null;
      let playerBName: string | null = null;

      if (roundIndex === 0) {
        const slotA = slots[position * 2];
        const slotB = slots[position * 2 + 1];
        if (slotA) {
          playerAId = slotA.playerId;
          playerAName = slotA.playerName;
        } else playerAName = "BYE";
        if (slotB) {
          playerBId = slotB.playerId;
          playerBName = slotB.playerName;
        } else playerBName = "BYE";
      } else {
        playerAName = `Winner ${roundNames[roundIndex - 1]} ${position * 2 + 1}`;
        playerBName = `Winner ${roundNames[roundIndex - 1]} ${position * 2 + 2}`;
      }

      const [inserted] = await tx
        .insert(tournamentMatches)
        .values({
          tournamentId,
          round: roundName,
          bracketPosition: position,
          playerAId,
          playerBId,
          playerAName,
          playerBName,
          ...matchInsertMeta("knockout", { round: roundName, bracketPosition: position }),
          status: "scheduled",
        })
        .returning({ id: tournamentMatches.id });

      currentIds.push(inserted.id);
    }

    if (previousIds.length > 0) {
      for (let i = 0; i < previousIds.length; i += 1) {
        await tx
          .update(tournamentMatches)
          .set({ nextMatchId: currentIds[Math.floor(i / 2)] })
          .where(eq(tournamentMatches.id, previousIds[i]));
      }
    }

    previousIds = currentIds;
  }
}

async function generateRoundRobinStructure(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  tournamentId: string,
  participants: ParticipantSeed[]
) {
  const [pool] = await tx
    .insert(tournamentPools)
    .values({ tournamentId, name: "Pool A", sortOrder: 0 })
    .returning({ id: tournamentPools.id });

  for (const [index, participant] of participants.entries()) {
    await tx.insert(tournamentStandings).values({
      poolId: pool.id,
      playerId: participant.playerId,
      rank: index + 1,
    });
    await tx
      .update(tournamentParticipants)
      .set({ poolId: pool.id })
      .where(
        and(
          eq(tournamentParticipants.tournamentId, tournamentId),
          eq(tournamentParticipants.playerId, participant.playerId)
        )
      );
  }

  let position = 0;
  for (let i = 0; i < participants.length; i += 1) {
    for (let j = i + 1; j < participants.length; j += 1) {
      await tx.insert(tournamentMatches).values({
        tournamentId,
        round: "RR",
        bracketPosition: position,
        poolId: pool.id,
        playerAId: participants[i].playerId,
        playerBId: participants[j].playerId,
        playerAName: participants[i].playerName,
        playerBName: participants[j].playerName,
        ...matchInsertMeta("round_robin", { round: "RR", bracketPosition: position }),
        status: "scheduled",
      });
      position += 1;
    }
  }
}

async function generatePoolKnockoutStructure(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  tournamentId: string,
  participants: ParticipantSeed[]
) {
  const poolCount = participants.length >= 4 ? 2 : 1;
  const chunkSize = Math.ceil(participants.length / poolCount);
  const sfIds: string[] = [];

  for (let p = 0; p < poolCount; p += 1) {
    const members = participants.slice(p * chunkSize, (p + 1) * chunkSize);
    const poolName = `Pool ${String.fromCharCode(65 + p)}`;
    const [pool] = await tx
      .insert(tournamentPools)
      .values({ tournamentId, name: poolName, sortOrder: p })
      .returning({ id: tournamentPools.id });

    for (const member of members) {
      await tx.insert(tournamentStandings).values({ poolId: pool.id, playerId: member.playerId });
      await tx
        .update(tournamentParticipants)
        .set({ poolId: pool.id })
        .where(
          and(
            eq(tournamentParticipants.tournamentId, tournamentId),
            eq(tournamentParticipants.playerId, member.playerId)
          )
        );
    }

    let position = 0;
    for (let i = 0; i < members.length; i += 1) {
      for (let j = i + 1; j < members.length; j += 1) {
        await tx.insert(tournamentMatches).values({
          tournamentId,
          round: "Pool",
          bracketPosition: position,
          poolId: pool.id,
          playerAId: members[i].playerId,
          playerBId: members[j].playerId,
          playerAName: members[i].playerName,
          playerBName: members[j].playerName,
          ...matchInsertMeta("pool_knockout", {
            round: "Pool",
            bracketPosition: position,
            poolName,
          }),
          status: "scheduled",
        });
        position += 1;
      }
    }
  }

  for (let i = 0; i < 2; i += 1) {
    const [sf] = await tx
      .insert(tournamentMatches)
      .values({
        tournamentId,
        round: "SF",
        bracketPosition: i,
        playerAName: `Top Pool ${i === 0 ? "A" : "B"} #1`,
        playerBName: `Top Pool ${i === 0 ? "A" : "B"} #2`,
        ...matchInsertMeta("knockout", { round: "SF", bracketPosition: i }),
        status: "scheduled",
      })
      .returning({ id: tournamentMatches.id });
    sfIds.push(sf.id);
  }

  const [finalMatch] = await tx
    .insert(tournamentMatches)
    .values({
      tournamentId,
      round: "Final",
      bracketPosition: 0,
      playerAName: "Winner SF 1",
      playerBName: "Winner SF 2",
      ...matchInsertMeta("knockout", { round: "Final", bracketPosition: 0 }),
      status: "scheduled",
    })
    .returning({ id: tournamentMatches.id });

  for (const sfId of sfIds) {
    await tx
      .update(tournamentMatches)
      .set({ nextMatchId: finalMatch.id })
      .where(eq(tournamentMatches.id, sfId));
  }
}

async function generateDoubleEliminationStructure(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  tournamentId: string,
  participants: ParticipantSeed[]
) {
  const count = participants.length;
  if (count < 2) return;

  async function insertDeMatch(
    params: {
      round: string;
      bracketPosition: number;
      groupLabel: string;
      playerAId?: string | null;
      playerBId?: string | null;
      playerAName?: string | null;
      playerBName?: string | null;
    }
  ) {
    const [inserted] = await tx
      .insert(tournamentMatches)
      .values({
        tournamentId,
        round: params.round,
        bracketPosition: params.bracketPosition,
        groupLabel: params.groupLabel,
        playerAId: params.playerAId ?? null,
        playerBId: params.playerBId ?? null,
        playerAName: params.playerAName ?? "TBD",
        playerBName: params.playerBName ?? "TBD",
        ...matchInsertMeta("double_elimination", {
          round: params.round,
          bracketPosition: params.bracketPosition,
          groupLabel: params.groupLabel,
        }),
        status: "scheduled",
      })
      .returning({ id: tournamentMatches.id });
    return inserted.id;
  }

  async function linkNext(fromId: string, toId: string) {
    await tx.update(tournamentMatches).set({ nextMatchId: toId }).where(eq(tournamentMatches.id, fromId));
  }

  async function linkLoser(fromId: string, toId: string) {
    await tx
      .update(tournamentMatches)
      .set({ loserNextMatchId: toId })
      .where(eq(tournamentMatches.id, fromId));
  }

  const bracketSize = nextPowerOfTwo(count);
  const slots: (ParticipantSeed | null)[] = Array.from({ length: bracketSize }, (_, i) =>
    participants[i] ?? null
  );

  const wbR1Ids: string[] = [];
  for (let i = 0; i < slots.length; i += 2) {
    const slotA = slots[i];
    const slotB = slots[i + 1];
    const id = await insertDeMatch({
      round: "WB-R1",
      bracketPosition: wbR1Ids.length,
      groupLabel: "winners",
      playerAId: slotA?.playerId ?? null,
      playerBId: slotB?.playerId ?? null,
      playerAName: slotA?.playerName ?? "BYE",
      playerBName: slotB?.playerName ?? "BYE",
    });
    wbR1Ids.push(id);
  }

  const grandFinalId = await insertDeMatch({
    round: "Final",
    bracketPosition: 0,
    groupLabel: "grand_final",
    playerAName: "Winners bracket champion",
    playerBName: "Losers bracket champion",
  });

  if (bracketSize <= 4) {
    const wbFinalId = await insertDeMatch({
      round: "WB-Final",
      bracketPosition: 0,
      groupLabel: "winners",
      playerAName: "Winner WB-R1 1",
      playerBName: "Winner WB-R1 2",
    });

    const lbR1Id = await insertDeMatch({
      round: "LB-R1",
      bracketPosition: 0,
      groupLabel: "losers",
      playerAName: "TBD",
      playerBName: "TBD",
    });

    for (const wbId of wbR1Ids) {
      await linkNext(wbId, wbFinalId);
      await linkLoser(wbId, lbR1Id);
    }
    await linkNext(wbFinalId, grandFinalId);
    await linkNext(lbR1Id, grandFinalId);
    return;
  }

  const wbSfIds: string[] = [];
  for (let i = 0; i < wbR1Ids.length / 2; i += 1) {
    const id = await insertDeMatch({
      round: "WB-SF",
      bracketPosition: i,
      groupLabel: "winners",
      playerAName: `Winner WB-R1 ${i * 2 + 1}`,
      playerBName: `Winner WB-R1 ${i * 2 + 2}`,
    });
    wbSfIds.push(id);
    await linkNext(wbR1Ids[i * 2], id);
    await linkNext(wbR1Ids[i * 2 + 1], id);
  }

  const wbFinalId = await insertDeMatch({
    round: "WB-Final",
    bracketPosition: 0,
    groupLabel: "winners",
    playerAName: "Winner WB-SF 1",
    playerBName: "Winner WB-SF 2",
  });

  for (const sfId of wbSfIds) {
    await linkNext(sfId, wbFinalId);
  }
  await linkNext(wbFinalId, grandFinalId);

  const lbR1Ids: string[] = [];
  for (let i = 0; i < wbR1Ids.length / 2; i += 1) {
    const id = await insertDeMatch({
      round: "LB-R1",
      bracketPosition: i,
      groupLabel: "losers",
      playerAName: "TBD",
      playerBName: "TBD",
    });
    lbR1Ids.push(id);
    await linkLoser(wbR1Ids[i * 2], id);
    await linkLoser(wbR1Ids[i * 2 + 1], id);
  }

  const lbFinalId = await insertDeMatch({
    round: "LB-Final",
    bracketPosition: 0,
    groupLabel: "losers",
    playerAName: "Winner LB-R1 1",
    playerBName: "Winner LB-R1 2",
  });

  for (const lbId of lbR1Ids) {
    await linkNext(lbId, lbFinalId);
  }
  await linkNext(lbFinalId, grandFinalId);
}

async function generateHeatsStructure(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  tournamentId: string,
  participants: ParticipantSeed[]
) {
  const lanesPerHeat = 6;
  for (let index = 0; index < participants.length; index += 1) {
    const heatNumber = Math.floor(index / lanesPerHeat) + 1;
    const laneNumber = (index % lanesPerHeat) + 1;
    const participant = participants[index];
    await tx.insert(tournamentMatches).values({
      tournamentId,
      round: "Heat",
      bracketPosition: index,
      heatNumber,
      laneNumber,
      playerAId: participant.playerId,
      playerAName: participant.playerName,
      ...matchInsertMeta("heats", {
        round: "Heat",
        bracketPosition: index,
        heatNumber,
        laneNumber,
      }),
      status: "scheduled",
    });
  }
}

async function generateTrialStructure(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  tournamentId: string,
  participants: ParticipantSeed[],
  ratings: Map<string, number>
) {
  const [pool] = await tx
    .insert(tournamentPools)
    .values({ tournamentId, name: "Merit list", sortOrder: 0 })
    .returning({ id: tournamentPools.id });

  const sorted = [...participants].sort(
    (a, b) => (ratings.get(b.playerId) ?? 0) - (ratings.get(a.playerId) ?? 0)
  );

  for (const [index, participant] of sorted.entries()) {
    await tx.insert(tournamentStandings).values({
      poolId: pool.id,
      playerId: participant.playerId,
      rank: index + 1,
      resultValue: String(ratings.get(participant.playerId) ?? 0),
    });
    await tx
      .update(tournamentParticipants)
      .set({ poolId: pool.id })
      .where(
        and(
          eq(tournamentParticipants.tournamentId, tournamentId),
          eq(tournamentParticipants.playerId, participant.playerId)
        )
      );
  }
}

async function generateTournamentStructure(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  tournamentId: string,
  format: CompetitionFormat,
  participants: ParticipantSeed[],
  ratings: Map<string, number>
) {
  switch (format) {
    case "knockout":
      await generateKnockoutStructure(tx, tournamentId, participants);
      break;
    case "round_robin":
      await generateRoundRobinStructure(tx, tournamentId, participants);
      break;
    case "pool_knockout":
      await generatePoolKnockoutStructure(tx, tournamentId, participants);
      break;
    case "double_elimination":
      await generateDoubleEliminationStructure(tx, tournamentId, participants);
      break;
    case "heats":
      await generateHeatsStructure(tx, tournamentId, participants);
      break;
    case "trial":
      await generateTrialStructure(tx, tournamentId, participants, ratings);
      break;
    default:
      break;
  }
}

export async function getTournamentParticipants(
  tournamentId: string
): Promise<TournamentParticipantRow[]> {
  const rows = await db
    .select({
      participant: tournamentParticipants,
      player: players,
      academy: academies,
      batchName: batches.name,
    })
    .from(tournamentParticipants)
    .innerJoin(players, eq(tournamentParticipants.playerId, players.id))
    .innerJoin(academies, eq(tournamentParticipants.academyId, academies.id))
    .leftJoin(batches, eq(players.batchId, batches.id))
    .where(eq(tournamentParticipants.tournamentId, tournamentId))
    .orderBy(tournamentParticipants.seedOrder);

  return rows.map((row) => ({
    playerId: row.player.id,
    playerName: row.player.fullName,
    academyId: row.academy.id,
    academyName: row.academy.name,
    seedOrder: row.participant.seedOrder,
    rating: row.player.rating != null ? String(row.player.rating) : null,
    batch: row.batchName ?? "—",
    weight: row.player.weightCategory ?? "—",
  }));
}

export async function createTournament(
  academyId: string,
  payload: CreateTournamentPayload
): Promise<{ id: string; name: string; status: string }> {
  if (payload.participantIds.length === 0) {
    throw new Error("Select at least one athlete.");
  }

  const startDate = new Date(payload.startDate);
  const endDate = new Date(payload.endDate);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new Error("Invalid start or end date.");
  }

  const academyIds = new Set(payload.participantIds.map((p) => p.academyId));

  const playerRows = await db
    .select({
      id: players.id,
      academyId: players.academyId,
      fullName: players.fullName,
      rating: players.rating,
    })
    .from(players)
    .where(
      inArray(
        players.id,
        payload.participantIds.map((p) => p.playerId)
      )
    );

  const playerMap = new Map(playerRows.map((p) => [p.id, p]));
  const seeds: ParticipantSeed[] = payload.participantIds
    .map((p, index) => {
      const row = playerMap.get(p.playerId);
      if (!row) return null;
      return {
        playerId: row.id,
        academyId: row.academyId,
        playerName: row.fullName,
        seedOrder: index + 1,
      };
    })
    .filter((p): p is ParticipantSeed => p != null);

  const ratings = new Map<string, number>(
    playerRows.map((p) => [p.id, Number(p.rating ?? 0)])
  );

  return db.transaction(async (tx) => {
    await tx
      .update(tournaments)
      .set({ status: "completed" })
      .where(and(eq(tournaments.academyId, academyId), eq(tournaments.status, "live")));

    const weightNorm = normalizeWeightKg(payload.weightClass ?? null);

    const [created] = await tx
      .insert(tournaments)
      .values({
        academyId,
        name: payload.name.trim(),
        location: payload.location.trim(),
        startDate,
        endDate,
        status: "live",
        sportId: payload.sportId,
        weightClass: weightNorm,
        participationScope: payload.participationScope,
        competitionFormat: payload.competitionFormat,
        ageDivision: payload.ageDivision,
        description: payload.description?.trim() || null,
        participantAcademies: academyIds.size,
        participantAthletes: seeds.length,
      })
      .returning({ id: tournaments.id });

    const tournamentId = created!.id;

    for (const seed of seeds) {
      await tx.insert(tournamentParticipants).values({
        tournamentId,
        playerId: seed.playerId,
        academyId: seed.academyId,
        seedOrder: seed.seedOrder,
      });
    }

    await generateTournamentStructure(
      tx,
      tournamentId,
      payload.competitionFormat,
      seeds,
      ratings
    );

    await tx.insert(tournamentMedals).values({
      tournamentId,
      academyId,
      gold: 0,
      silver: 0,
      bronze: 0,
    });

    return { id: tournamentId, name: payload.name.trim(), status: "live" as const };
  });
}

type MatchSide = "a" | "b";

function sidePatch(
  side: MatchSide,
  playerId: string | null,
  playerName: string | null
): Record<string, string | null> {
  return side === "a"
    ? { playerAId: playerId, playerAName: playerName }
    : { playerBId: playerId, playerBName: playerName };
}

function readSide(
  match: {
    playerAId: string | null;
    playerBId: string | null;
    playerAName: string | null;
    playerBName: string | null;
  },
  side: MatchSide
) {
  return side === "a"
    ? { playerId: match.playerAId, playerName: match.playerAName }
    : { playerId: match.playerBId, playerName: match.playerBName };
}

async function fillMatchAthleteSlot(
  matchId: string,
  playerId: string | null,
  playerName: string | null,
  preferredSide?: MatchSide
) {
  const [match] = await db
    .select()
    .from(tournamentMatches)
    .where(eq(tournamentMatches.id, matchId))
    .limit(1);

  if (!match) return;

  if (preferredSide) {
    const slot = readSide(match, preferredSide);
    if (isOpenAthleteSlot(slot.playerId, slot.playerName)) {
      await db
        .update(tournamentMatches)
        .set(sidePatch(preferredSide, playerId, playerName))
        .where(eq(tournamentMatches.id, matchId));
      return;
    }
  }

  if (isOpenAthleteSlot(match.playerAId, match.playerAName)) {
    await db
      .update(tournamentMatches)
      .set(sidePatch("a", playerId, playerName))
      .where(eq(tournamentMatches.id, matchId));
    return;
  }

  if (isOpenAthleteSlot(match.playerBId, match.playerBName)) {
    await db
      .update(tournamentMatches)
      .set(sidePatch("b", playerId, playerName))
      .where(eq(tournamentMatches.id, matchId));
  }
}

export async function moveTournamentMatchAthlete(
  tournamentId: string,
  from: { matchId: string; side: MatchSide },
  to: { matchId: string; side: MatchSide }
) {
  if (from.matchId === to.matchId && from.side === to.side) {
    throw new Error("Source and target slots must differ.");
  }

  return db.transaction(async (tx) => {
    const [source] = await tx
      .select()
      .from(tournamentMatches)
      .where(
        and(
          eq(tournamentMatches.id, from.matchId),
          eq(tournamentMatches.tournamentId, tournamentId)
        )
      )
      .limit(1);

    const [target] = await tx
      .select()
      .from(tournamentMatches)
      .where(
        and(
          eq(tournamentMatches.id, to.matchId),
          eq(tournamentMatches.tournamentId, tournamentId)
        )
      )
      .limit(1);

    if (!source || !target) throw new Error("Match not found.");
    if (source.status === "completed") {
      throw new Error("Cannot move athletes from a completed match.");
    }

    const sourceAthlete = readSide(source, from.side);
    const sourceIsEmpty = isOpenAthleteSlot(sourceAthlete.playerId, sourceAthlete.playerName);
    if (sourceIsEmpty) {
      throw new Error("Source slot has no athlete to move.");
    }

    const targetAthlete = readSide(target, to.side);
    if (!isOpenAthleteSlot(targetAthlete.playerId, targetAthlete.playerName)) {
      throw new Error("Target slot is already occupied.");
    }

    await tx
      .update(tournamentMatches)
      .set(sidePatch(to.side, sourceAthlete.playerId, sourceAthlete.playerName))
      .where(eq(tournamentMatches.id, target.id));

    await tx
      .update(tournamentMatches)
      .set(sidePatch(from.side, null, "TBD"))
      .where(eq(tournamentMatches.id, source.id));

    return { ok: true };
  });
}

function grandFinalAdvanceSide(source: {
  groupLabel: string | null;
  round: string;
}): MatchSide | undefined {
  if (source.groupLabel === "grand_final" || source.round === "Final") return undefined;
  if (source.groupLabel === "losers" || source.round.startsWith("LB")) return "b";
  if (source.groupLabel === "winners" || source.round.startsWith("WB")) return "a";
  return undefined;
}

async function resolveAdvanceSide(
  nextMatchId: string,
  source: { groupLabel: string | null; round: string }
): Promise<MatchSide | undefined> {
  const [nextMatch] = await db
    .select({
      groupLabel: tournamentMatches.groupLabel,
      round: tournamentMatches.round,
    })
    .from(tournamentMatches)
    .where(eq(tournamentMatches.id, nextMatchId))
    .limit(1);

  if (!nextMatch || nextMatch.groupLabel !== "grand_final") return undefined;
  return grandFinalAdvanceSide(source);
}

export async function updateTournamentMatch(
  tournamentId: string,
  matchId: string,
  payload: UpdateTournamentMatchPayload
) {
  const [existing] = await db
    .select()
    .from(tournamentMatches)
    .where(
      and(eq(tournamentMatches.id, matchId), eq(tournamentMatches.tournamentId, tournamentId))
    )
    .limit(1);

  if (!existing) throw new Error("Match not found.");

  if (payload.status === "live") {
    await db
      .update(tournamentMatches)
      .set({ status: "scheduled" })
      .where(
        and(
          eq(tournamentMatches.tournamentId, tournamentId),
          eq(tournamentMatches.status, "live")
        )
      );
  }

  let winnerPlayerId = payload.winnerPlayerId ?? existing.winnerPlayerId;
  let scoreA = payload.scoreA ?? existing.scoreA;
  let scoreB = payload.scoreB ?? existing.scoreB;

  if (payload.winnerSide === "a") {
    winnerPlayerId = payload.playerAId ?? existing.playerAId;
  } else if (payload.winnerSide === "b") {
    winnerPlayerId = payload.playerBId ?? existing.playerBId;
  }

  if (
    payload.scoreA != null &&
    payload.scoreB != null &&
    payload.scoreA !== payload.scoreB &&
    !winnerPlayerId
  ) {
    winnerPlayerId =
      payload.scoreA > payload.scoreB ? existing.playerAId : existing.playerBId;
  }

  let scheduledAt = existing.scheduledAt;
  if (payload.scheduledAt !== undefined) {
    scheduledAt = payload.scheduledAt ? new Date(payload.scheduledAt) : null;
  }

  await db
    .update(tournamentMatches)
    .set({
      playerAId: payload.playerAId !== undefined ? payload.playerAId : existing.playerAId,
      playerBId: payload.playerBId !== undefined ? payload.playerBId : existing.playerBId,
      playerAName:
        payload.playerAName !== undefined ? payload.playerAName : existing.playerAName,
      playerBName:
        payload.playerBName !== undefined ? payload.playerBName : existing.playerBName,
      scoreA,
      scoreB,
      winnerPlayerId,
      status: payload.status ?? (winnerPlayerId ? "completed" : existing.status),
      scheduledAt,
      matLabel: payload.matLabel !== undefined ? payload.matLabel : existing.matLabel,
      matchLabel: payload.matchLabel !== undefined ? payload.matchLabel : existing.matchLabel,
    })
    .where(eq(tournamentMatches.id, matchId));

  if (payload.advanceWinner && winnerPlayerId) {
    if (existing.nextMatchId) {
      const winnerName =
        winnerPlayerId === existing.playerAId
          ? (payload.playerAName ?? existing.playerAName)
          : (payload.playerBName ?? existing.playerBName);

      const advanceSide = await resolveAdvanceSide(existing.nextMatchId, existing);
      await fillMatchAthleteSlot(
        existing.nextMatchId,
        winnerPlayerId,
        winnerName,
        advanceSide
      );
    }

    const loserPlayerId =
      winnerPlayerId === existing.playerAId ? existing.playerBId : existing.playerAId;
    const loserName =
      winnerPlayerId === existing.playerAId
        ? (payload.playerBName ?? existing.playerBName)
        : (payload.playerAName ?? existing.playerAName);

    const canRouteLoser =
      Boolean(loserPlayerId) ||
      (loserName != null && !isPlaceholderAthleteName(loserName));

    if (existing.loserNextMatchId && canRouteLoser) {
      await fillMatchAthleteSlot(
        existing.loserNextMatchId,
        loserPlayerId ?? null,
        loserName ?? null
      );
    }
  }

  const [updated] = await db
    .select()
    .from(tournamentMatches)
    .where(eq(tournamentMatches.id, matchId))
    .limit(1);

  return updated;
}

export async function updateTournamentMedals(
  tournamentId: string,
  academyId: string,
  payload: UpdateTournamentMedalsPayload
) {
  const [existing] = await db
    .select()
    .from(tournamentMedals)
    .where(
      and(
        eq(tournamentMedals.tournamentId, tournamentId),
        eq(tournamentMedals.academyId, academyId)
      )
    )
    .limit(1);

  if (existing) {
    const [row] = await db
      .update(tournamentMedals)
      .set({
        gold: payload.gold,
        silver: payload.silver,
        bronze: payload.bronze,
      })
      .where(eq(tournamentMedals.id, existing.id))
      .returning();
    return row;
  }

  const [row] = await db
    .insert(tournamentMedals)
    .values({
      tournamentId,
      academyId,
      gold: payload.gold,
      silver: payload.silver,
      bronze: payload.bronze,
    })
    .returning();

  return row;
}

export async function endTournament(tournamentId: string, academyId: string) {
  const [tournament] = await db
    .select()
    .from(tournaments)
    .where(and(eq(tournaments.id, tournamentId), eq(tournaments.academyId, academyId)))
    .limit(1);

  if (!tournament) throw new Error("Tournament not found.");
  if (tournament.status !== "live") throw new Error("Only live tournaments can be ended.");

  await db.transaction(async (tx) => {
    await tx
      .update(tournamentMatches)
      .set({ status: "scheduled" })
      .where(
        and(
          eq(tournamentMatches.tournamentId, tournamentId),
          eq(tournamentMatches.status, "live")
        )
      );

    await tx
      .update(tournaments)
      .set({ status: "completed" })
      .where(eq(tournaments.id, tournamentId));
  });

  return { id: tournamentId, status: "completed" as const };
}
