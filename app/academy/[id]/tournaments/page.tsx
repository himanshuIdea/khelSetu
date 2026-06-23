import { TournamentsWorkspace } from "@/components/academy/TournamentsWorkspace";
import { PageBody } from "@/components/academy/shared";
import { resolveAcademy } from "@/lib/repositories/resolve-academy";
import { getPlayerFormOptions } from "@/lib/repositories/players";
import {
  getActiveTournament,
  getBracketMatches,
  getTournamentMedals,
  getTournamentSchedule,
  getTournamentStandings,
} from "@/lib/repositories/tournaments";
import type { DbBracketMatch } from "@/components/academy/tournaments/bracket-utils";
import { resolveMatchDisplayLabel } from "@/lib/tournament-match-labels";

type TournamentsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TournamentsPage({ params }: TournamentsPageProps) {
  const { id } = await params;
  const [academy, tournament, formOptions] = await Promise.all([
    resolveAcademy(id),
    getActiveTournament(id),
    getPlayerFormOptions(id),
  ]);

  const tournamentId = tournament?.id ?? null;

  const [bracketMatches, scheduleMatches, medals, standings] = tournamentId
    ? await Promise.all([
        getBracketMatches(tournamentId),
        getTournamentSchedule(tournamentId),
        getTournamentMedals(tournamentId, id),
        getTournamentStandings(tournamentId),
      ])
    : [[], [], { gold: 0, silver: 0, bronze: 0 }, []];

  const academyDisplayName = academy.initials === "DA" ? "Dronacharya" : academy.name;

  const dbMatches: DbBracketMatch[] = bracketMatches.map((match) => ({
    id: match.id,
    round: match.round,
    bracketPosition: match.bracketPosition,
    playerAName: match.playerAName,
    playerBName: match.playerBName,
    scoreA: match.scoreA,
    scoreB: match.scoreB,
    status: match.status,
    winnerPlayerId: match.winnerPlayerId,
    playerAId: match.playerAId,
    playerBId: match.playerBId,
    matLabel: match.matLabel,
    matchLabel: match.matchLabel ?? resolveMatchDisplayLabel(match),
    scheduledAt: match.scheduledAt?.toISOString() ?? null,
    heatNumber: match.heatNumber,
    laneNumber: match.laneNumber,
    groupLabel: match.groupLabel,
    poolId: match.poolId,
  }));

  return (
    <PageBody className="flex flex-col min-h-0 flex-1 lg:max-h-[calc(100dvh-66px)] lg:overflow-hidden">
      <TournamentsWorkspace
        academyId={id}
        academyName={academyDisplayName}
        sports={formOptions.sports}
        tournament={tournament}
        bracketMatches={dbMatches}
        scheduleMatches={scheduleMatches}
        medals={medals}
        standings={standings}
      />
    </PageBody>
  );
}
