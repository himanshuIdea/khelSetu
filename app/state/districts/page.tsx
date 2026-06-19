import {
  AcademyTable,
  PageHeader,
  TableCell,
  TableRow,
} from "@/components/academy/shared";
import { StateListEmpty } from "@/components/state/StateEmptyStates";
import { StatePageBody } from "@/components/state/StatePageBody";
import { stateLayout } from "@/lib/state-layout";
import { listStateDistrictRollup } from "@/lib/repositories/state-districts";
import { statePageMeta } from "@/lib/state-nav";
import { HARYANA_DISTRICTS } from "@/lib/state-catalog";

const meta = statePageMeta.districts;

function verificationRateClass(rate: number | null): string {
  if (rate === null) return "text-muted";
  if (rate >= 80) return "text-[#0E9B72]";
  if (rate > 0) return "text-[#C77F12]";
  return "text-[#D63B3B]";
}

export default async function DistrictsPage() {
  const districts = await listStateDistrictRollup();
  const hasDistricts = districts.some((d) => d.nurseries > 0 || d.athleteCount > 0);

  return (
    <StatePageBody variant="list">
      <div className={stateLayout.listWorkspace}>
        <div className={stateLayout.listChrome}>
          <PageHeader
            title={meta.title}
            subtitle={
              hasDistricts
                ? `Performance and coverage across all ${HARYANA_DISTRICTS.length} districts`
                : "District performance and coverage metrics appear after statewide registration"
            }
            actionLabel={hasDistricts ? meta.actionLabel : undefined}
          />
        </div>

        <div className={stateLayout.listScrollRegion}>
          {hasDistricts ? (
            <AcademyTable
              scrollable
              headers={["District", "Nurseries", "Athletes", "Verification", "Coaches"]}
              minWidth={560}
            >
              {districts.map((d) => (
                <TableRow key={d.name}>
                  <TableCell>
                    <b className="text-ink">{d.name}</b>
                  </TableCell>
                  <TableCell>{d.nurseries}</TableCell>
                  <TableCell>{d.athletes}</TableCell>
                  <TableCell>
                    <b className={verificationRateClass(d.verificationRate)}>{d.verified}</b>
                  </TableCell>
                  <TableCell>{d.coaches}</TableCell>
                </TableRow>
              ))}
            </AcademyTable>
          ) : (
            <StateListEmpty screen="districts" />
          )}
        </div>
      </div>
    </StatePageBody>
  );
}
