import { DotsIcon } from "@/components/academy/icons";
import {
  AcademyTable,
  Avatar,
  FilterPills,
  PageBody,
  PageHeader,
  Pill,
  StatCard,
  StatGrid,
  TableCell,
  TableRow,
} from "@/components/academy/shared";
import { nurseriesList } from "@/lib/state-mock-data";
import { statePageMeta } from "@/lib/state-nav";

const meta = statePageMeta.verification;
const filters = ["All statuses", "District: All", "Flagged only"];

export default function VerificationPage() {
  return (
    <PageBody>
      <PageHeader title={meta.title} subtitle={meta.subtitle} actionLabel={meta.actionLabel!} />

      <StatGrid>
        <StatCard compact value="1,768" label="Verified" valueColor="#0E9B72" />
        <StatCard compact value="52" label="Pending review" valueColor="#C77F12" />
        <StatCard compact value="22" label="Flagged" valueColor="#D63B3B" />
        <StatCard compact value="96%" label="Overall verification rate" valueColor="#0E9B72" />
      </StatGrid>

      <FilterPills>
        {filters.map((f, i) => (
          <Pill key={f} variant={i === 0 ? "brand" : "grey"} className="px-[13px] py-2 shrink-0">
            {f}
          </Pill>
        ))}
      </FilterPills>

      <AcademyTable headers={["Nursery", "District", "Athletes", "Status", ""]} minWidth={600}>
        {nurseriesList.map((n) => (
          <TableRow key={n.name} highlighted={n.status === "red"}>
            <TableCell>
              <div className="flex items-center gap-[11px]">
                <Avatar initials={n.initials} color={n.color} />
                <div className="font-semibold text-[13px] text-ink">{n.name}</div>
              </div>
            </TableCell>
            <TableCell>{n.detail.split(" · ")[0]}</TableCell>
            <TableCell>{n.athletes}</TableCell>
            <TableCell><Pill variant={n.status}>{n.statusLabel}</Pill></TableCell>
            <TableCell><DotsIcon className="text-muted2" /></TableCell>
          </TableRow>
        ))}
      </AcademyTable>
    </PageBody>
  );
}
