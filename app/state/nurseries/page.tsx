import { PageBody } from "@/components/academy/shared";
import { NurseriesWorkspace } from "@/components/state/NurseriesWorkspace";
import { listStateNurseries } from "@/lib/repositories/state-nurseries";

export default async function NurseriesPage() {
  const nurseries = await listStateNurseries();

  return (
    <PageBody>
      <NurseriesWorkspace nurseries={nurseries} />
    </PageBody>
  );
}
