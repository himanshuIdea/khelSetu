import { DotsIcon } from "@/components/academy/icons";
import {
  AcademyTable,
  Avatar,
  FilterPills,
  PageBody,
  PageHeader,
  Pill,
  TableCell,
  TableRow,
} from "@/components/academy/shared";
import { nurseriesList } from "@/lib/state-mock-data";
import { statePageMeta } from "@/lib/state-nav";

const meta = statePageMeta.nurseries;
const filters = ["All districts", "Sport: All", "Status: Verified"];

export default function NurseriesPage() {
  return (
    <PageBody>
      <PageHeader title={meta.title} subtitle={meta.subtitle} actionLabel={meta.actionLabel!} />

      <FilterPills>
        {filters.map((f, i) => (
          <Pill key={f} variant={i === 0 ? "brand" : "grey"} className="px-[13px] py-2 shrink-0">
            {f}
          </Pill>
        ))}
      </FilterPills>

      <AcademyTable headers={["Nursery", "District · Sport", "Athletes", "Status", ""]} minWidth={640}>
        {nurseriesList.map((n) => (
          <TableRow key={n.name}>
            <TableCell>
              <div className="flex items-center gap-[11px]">
                <Avatar initials={n.initials} color={n.color} />
                <div>
                  <div className="font-semibold text-[13px] text-ink">{n.name}</div>
                  <div className="text-[11.5px] text-muted">{n.detail}</div>
                </div>
              </div>
            </TableCell>
            <TableCell>{n.detail}</TableCell>
            <TableCell><b>{n.athletes}</b></TableCell>
            <TableCell><Pill variant={n.status}>{n.statusLabel}</Pill></TableCell>
            <TableCell><DotsIcon className="text-muted2" /></TableCell>
          </TableRow>
        ))}
      </AcademyTable>
    </PageBody>
  );
}
