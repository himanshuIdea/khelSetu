import { PlayersPageHeader } from "@/components/academy/PlayersPageHeader";
import { PlayersWorkspace } from "@/components/academy/PlayersWorkspace";
import { PageBody } from "@/components/academy/shared";
import { getPlayerFormOptions, getPlayers } from "@/lib/repositories/players";

type PlayersPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PlayersPage({ params }: PlayersPageProps) {
  const { id } = await params;

  const [players, formOptions] = await Promise.all([
    getPlayers(id),
    getPlayerFormOptions(id),
  ]);

  const activeCount = players.filter((player) => player.status === "Active").length;
  const onHoldCount = players.filter((player) => player.status === "On hold").length;

  return (
    <PageBody className="lg:pr-0">
      <PlayersWorkspace academyId={id} players={players} formOptions={formOptions}>
        <PlayersPageHeader
          academyId={id}
          subtitle={`${activeCount} active · ${onHoldCount} on hold · onboard, track and manage every athlete.`}
          formOptions={formOptions}
        />
      </PlayersWorkspace>
    </PageBody>
  );
}
