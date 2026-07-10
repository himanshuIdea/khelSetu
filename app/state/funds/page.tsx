import { StatePageBody } from "@/components/state/StatePageBody";
import { FundsWorkspace } from "@/components/state/funds/FundsWorkspace";
import { STATE_DEMO_FUNDS_DASHBOARD } from "@/lib/state-demo-funds";

export default async function FundsPage() {
  // TODO(demo): remove when live funds dashboard is ready for recordings
  const dashboard = STATE_DEMO_FUNDS_DASHBOARD;

  return (
    <StatePageBody>
      <FundsWorkspace dashboard={dashboard} />
    </StatePageBody>
  );
}
