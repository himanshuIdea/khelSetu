import { TournamentsWorkspace } from "@/components/academy/TournamentsWorkspace";
import { PageBody } from "@/components/academy/shared";
import { resolveAcademy } from "@/lib/repositories/resolve-academy";
import {
  getActiveTournament,
  getBracketMatches,
  getMatSchedule,
  getTournamentMedals,
} from "@/lib/repositories/tournaments";

type TournamentsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TournamentsPage({ params }: TournamentsPageProps) {
  const { id } = await params;
  const [academy, tournament] = await Promise.all([resolveAcademy(id), getActiveTournament(id)]);
  const tournamentId = tournament?.id ?? null;

  const [bracketMatches, matSchedule, medals] = tournamentId
    ? await Promise.all([
        getBracketMatches(tournamentId),
        getMatSchedule(tournamentId),
        getTournamentMedals(tournamentId, id),
      ])
    : [[], [], { gold: 0, silver: 0, bronze: 0 }];

  const academyDisplayName =
    academy.initials === "DA" ? "Dronacharya" : academy.name;

  return (
    <PageBody className="flex flex-col min-h-0 max-h-[calc(100dvh-66px)] lg:overflow-hidden">
      <TournamentsWorkspace
        academyName={academyDisplayName}
        seedTournament={tournament}
        seedBracketMatches={bracketMatches}
        seedMatSchedule={matSchedule}
        seedMedals={medals}
      />
    </PageBody>
  );
}
