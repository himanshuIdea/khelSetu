import { DistrictsWorkspace } from "@/components/state/DistrictsWorkspace";
import { StatePageBody } from "@/components/state/StatePageBody";
import { STATE_DEMO_DISTRICT_ROWS } from "@/lib/state-demo-districts";

export default async function DistrictsPage() {
  // TODO(demo): remove when live district rollup is ready for recordings
  const districts = STATE_DEMO_DISTRICT_ROWS;
  const hasDistricts = true;

  return (
    <StatePageBody variant="list">
      <DistrictsWorkspace districts={districts} hasDistricts={hasDistricts} />
    </StatePageBody>
  );
}
