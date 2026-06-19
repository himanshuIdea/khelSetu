import { StatePageBody } from "@/components/state/StatePageBody";
import { AthletesWorkspace } from "@/components/state/AthletesWorkspace";
import { listStateAthletes } from "@/lib/repositories/state-athletes";

export default async function AthletesPage() {
  const athletes = await listStateAthletes();

  return (
    <StatePageBody variant="list">
      <AthletesWorkspace athletes={athletes} />
    </StatePageBody>
  );
}
