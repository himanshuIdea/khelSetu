import { StatePageBody } from "@/components/state/StatePageBody";
import { ScoutingWorkspace } from "@/components/state/ScoutingWorkspace";
import {
  DEFAULT_SCOUTING_PAGE_SIZE,
  getStateScoutingDashboard,
  listStateScoutingProspectsPage,
} from "@/lib/repositories/state-scouting";

export const dynamic = "force-dynamic";

const DEFAULT_MIN_RATING = 8;

export default async function ScoutingPage() {
  const [dashboard, initialPage, scopePage] = await Promise.all([
    getStateScoutingDashboard(),
    listStateScoutingProspectsPage({
      filters: { minRating: DEFAULT_MIN_RATING },
      offset: 0,
      limit: DEFAULT_SCOUTING_PAGE_SIZE,
    }),
    listStateScoutingProspectsPage({ offset: 0, limit: 1 }),
  ]);

  return (
    <StatePageBody variant="list">
      <ScoutingWorkspace
        dashboard={dashboard}
        initialProspects={initialPage.items}
        initialTotal={initialPage.total}
        scopeTotal={scopePage.total}
        defaultMinRating={DEFAULT_MIN_RATING}
      />
    </StatePageBody>
  );
}
