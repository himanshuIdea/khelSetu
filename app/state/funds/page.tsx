import { StatePageBody } from "@/components/state/StatePageBody";
import { FundsWorkspace } from "@/components/state/funds/FundsWorkspace";
import { getStateFundsDashboard } from "@/lib/repositories/state-funds";

export default async function FundsPage() {
  const dashboard = await getStateFundsDashboard();

  return (
    <StatePageBody>
      <FundsWorkspace dashboard={dashboard} />
    </StatePageBody>
  );
}
