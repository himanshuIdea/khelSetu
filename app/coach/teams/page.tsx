import { TeamsWorkspace } from "@/components/academy/TeamsWorkspace";
import { PageBody } from "@/components/academy/shared";
import { requireCoachAccess } from "@/lib/auth/require-coach-access";
import {
  getCoachTeamFormOptions,
  getCoachTeamMemberFormOptions,
  getCoachOtherTeams,
  getLineupSuggestion,
  getTeamMembers,
  resolveActiveCoachTeam,
} from "@/lib/repositories/teams";

type CoachTeamsPageProps = {
  searchParams: Promise<{ team?: string }>;
};

export default async function CoachTeamsPage({ searchParams }: CoachTeamsPageProps) {
  const { team: teamId } = await searchParams;
  const { academyId, coachId } = await requireCoachAccess();

  const [activeTeam, formOptions] = await Promise.all([
    resolveActiveCoachTeam(academyId, coachId, teamId).catch(() => null),
    getCoachTeamFormOptions(academyId, coachId),
  ]);

  const [teamMembers, otherTeams, lineupSuggestion, memberFormOptions] = await Promise.all([
    getTeamMembers(academyId, activeTeam?.id),
    getCoachOtherTeams(academyId, coachId, activeTeam?.id),
    getLineupSuggestion(academyId, activeTeam?.id).catch(() => null),
    activeTeam
      ? getCoachTeamMemberFormOptions(academyId, coachId, activeTeam.id).catch(() => ({ players: [] }))
      : Promise.resolve({ players: [] }),
  ]);

  const teamCount = otherTeams.length + (activeTeam ? 1 : 0);

  return (
    <PageBody>
      <TeamsWorkspace
        academyId={academyId}
        activeTeam={activeTeam}
        otherTeams={otherTeams}
        teamMembers={teamMembers}
        lineupSuggestion={lineupSuggestion}
        memberFormOptions={memberFormOptions}
        formOptions={formOptions}
        coachId={coachId}
        headerSubtitle={`${teamCount} team${teamCount === 1 ? "" : "s"} · squads you coach sync with academy teams.`}
      />
    </PageBody>
  );
}
