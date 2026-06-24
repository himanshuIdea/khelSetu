import { StatePageBody } from "@/components/state/StatePageBody";
import { AthletesWorkspace } from "@/components/state/AthletesWorkspace";

const DEFAULT_MIN_RATING = 7;

export default function AthletesPage() {
  return (
    <StatePageBody variant="list">
      <AthletesWorkspace
        initialItems={[]}
        initialTotal={0}
        defaultMinRating={DEFAULT_MIN_RATING}
        fetchOnMount
      />
    </StatePageBody>
  );
}
