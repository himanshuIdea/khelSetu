import { TeamsWorkspace } from "@/components/academy/TeamsWorkspace";
import { PageBody } from "@/components/academy/shared";
import {
  getLineupSuggestion,
  getOtherTeams,
  getTeamFormOptions,
  getTeamMemberFormOptions,
  getTeamMembers,
  resolveActiveTeam,
} from "@/lib/repositories/teams";

type TeamsPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ team?: string }>;
};

export default async function TeamsPage({ params, searchParams }: TeamsPageProps) {
  const { id } = await params;
  const { team: teamId } = await searchParams;

  const [activeTeam, formOptions] = await Promise.all([
    resolveActiveTeam(id, teamId).catch(() => null),
    getTeamFormOptions(id),
  ]);

  const [teamMembers, otherTeams, lineupSuggestion, memberFormOptions] = await Promise.all([
    getTeamMembers(id, activeTeam?.id),
    getOtherTeams(id, activeTeam?.id),
    getLineupSuggestion(id, activeTeam?.id).catch(() => null),
    activeTeam
      ? getTeamMemberFormOptions(id, activeTeam.id).catch(() => ({ players: [] }))
      : Promise.resolve({ players: [] }),
  ]);

  return (
    <PageBody>
      <TeamsWorkspace
        academyId={id}
        activeTeam={activeTeam}
        otherTeams={otherTeams}
        teamMembers={teamMembers}
        lineupSuggestion={lineupSuggestion}
        memberFormOptions={memberFormOptions}
        formOptions={formOptions}
      />
    </PageBody>
  );
}
