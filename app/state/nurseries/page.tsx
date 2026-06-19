import { StatePageBody } from "@/components/state/StatePageBody";
import { NurseriesWorkspace } from "@/components/state/NurseriesWorkspace";
import { listStateNurseries } from "@/lib/repositories/state-nurseries";

export default async function NurseriesPage() {
  const nurseries = await listStateNurseries();

  return (
    <StatePageBody variant="list">
      <NurseriesWorkspace nurseries={nurseries} />
    </StatePageBody>
  );
}
