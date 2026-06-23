import { StatePageBody } from "@/components/state/StatePageBody";
import { ScoutingWorkspace } from "@/components/state/ScoutingWorkspace";
import {
  getStateScoutingDashboard,
  listStateScoutingProspects,
} from "@/lib/repositories/state-scouting";

export default async function ScoutingPage() {
  const [dashboard, prospects] = await Promise.all([
    getStateScoutingDashboard(),
    listStateScoutingProspects(),
  ]);

  return (
    <StatePageBody variant="list">
      <ScoutingWorkspace dashboard={dashboard} prospects={prospects} />
    </StatePageBody>
  );
}
