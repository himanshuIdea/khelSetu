import {
  AcademyTable,
  PageBody,
  PageHeader,
  TableCell,
  TableRow,
} from "@/components/academy/shared";
import { districtsList } from "@/lib/state-mock-data";
import { statePageMeta } from "@/lib/state-nav";

const meta = statePageMeta.districts;

export default function DistrictsPage() {
  return (
    <PageBody>
      <PageHeader title={meta.title} subtitle={meta.subtitle} actionLabel={meta.actionLabel!} />

      <AcademyTable headers={["District", "Nurseries", "Athletes", "Verified", "Coaches"]} minWidth={560}>
        {districtsList.map((d) => (
          <TableRow key={d.name}>
            <TableCell><b className="text-ink">{d.name}</b></TableCell>
            <TableCell>{d.nurseries}</TableCell>
            <TableCell>{d.athletes}</TableCell>
            <TableCell><b className="text-[#0E9B72]">{d.verified}</b></TableCell>
            <TableCell>{d.coaches}</TableCell>
          </TableRow>
        ))}
      </AcademyTable>
    </PageBody>
  );
}
