import { StatePageBody } from "@/components/state/StatePageBody";
import { ScoutingWorkspace } from "@/components/state/ScoutingWorkspace";
import { STATE_DEMO_SCOUTING_DASHBOARD } from "@/lib/state-demo-scouting";

export const dynamic = "force-dynamic";

const DEFAULT_MIN_RATING = 8;

export default async function ScoutingPage() {
  // TODO(demo): remove when live scouting dashboard is ready for recordings
  const dashboard = STATE_DEMO_SCOUTING_DASHBOARD;

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
