import { DistrictsWorkspace } from "@/components/state/DistrictsWorkspace";
import { StatePageBody } from "@/components/state/StatePageBody";
import { listStateDistrictRollup } from "@/lib/repositories/state-districts";

export default async function DistrictsPage() {
  const districts = await listStateDistrictRollup();
  const hasDistricts = districts.some((d) => d.nurseries > 0 || d.athleteCount > 0);

  return (
    <StatePageBody variant="list">
      <DistrictsWorkspace districts={districts} hasDistricts={hasDistricts} />
    </StatePageBody>
  );
}
