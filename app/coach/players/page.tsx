import { CoachPlayersWorkspace } from "@/components/coach/CoachPlayersWorkspace";
import { PageBody, PageHeader } from "@/components/academy/shared";
import { requireCoachAccess } from "@/lib/auth/require-coach-access";
import {
  getCoachPlayerFormOptions,
  getCoachPlayers,
} from "@/lib/repositories/players";

type CoachPlayersPageProps = {
  searchParams: Promise<{ batch?: string }>;
};

export default async function CoachPlayersPage({ searchParams }: CoachPlayersPageProps) {
  const { batch: batchId } = await searchParams;
  const { academyId, coachId } = await requireCoachAccess();

  const [players, formOptions] = await Promise.all([
    getCoachPlayers(academyId, coachId),
    getCoachPlayerFormOptions(academyId, coachId),
  ]);

  const activeCount = players.filter((player) => player.status === "Active").length;
  const onHoldCount = players.filter((player) => player.status === "On hold").length;

  return (
    <PageBody className="lg:pr-0">
      <CoachPlayersWorkspace
        academyId={academyId}
        players={players}
        formOptions={formOptions}
        initialBatchId={batchId}
      >
        <PageHeader
          title="My players"
          subtitle={`${activeCount} active · ${onHoldCount} on hold · athletes in your assigned batches.`}
        />
      </CoachPlayersWorkspace>
    </PageBody>
  );
}
