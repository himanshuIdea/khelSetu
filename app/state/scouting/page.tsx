import { StatePageBody } from "@/components/state/StatePageBody";
import { ScoutingWorkspace } from "@/components/state/ScoutingWorkspace";
import { getStateScoutingDashboard } from "@/lib/repositories/state-scouting";

export const dynamic = "force-dynamic";

const DEFAULT_MIN_RATING = 8;

export default async function ScoutingPage() {
  const dashboard = await getStateScoutingDashboard();

  return (
    <StatePageBody variant="list">
      <ScoutingWorkspace
        dashboard={dashboard}
        initialProspects={[]}
        initialTotal={0}
        scopeTotal={0}
        defaultMinRating={DEFAULT_MIN_RATING}
        fetchProspectsOnMount
      />
    </StatePageBody>
  );
}
