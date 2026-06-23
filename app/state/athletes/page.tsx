import { StatePageBody } from "@/components/state/StatePageBody";
import { AthletesWorkspace } from "@/components/state/AthletesWorkspace";
import {
  DEFAULT_ATHLETE_PAGE_SIZE,
  listStateAthletesPage,
} from "@/lib/repositories/state-athletes";

const DEFAULT_MIN_RATING = 7;

export default async function AthletesPage() {
  const { items, total } = await listStateAthletesPage({
    filters: { minRating: DEFAULT_MIN_RATING },
    offset: 0,
    limit: DEFAULT_ATHLETE_PAGE_SIZE,
  });

  return (
    <StatePageBody variant="list">
      <AthletesWorkspace
        initialItems={items}
        initialTotal={total}
        defaultMinRating={DEFAULT_MIN_RATING}
      />
    </StatePageBody>
  );
}
