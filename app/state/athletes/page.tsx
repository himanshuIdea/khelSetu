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
import { formatSportWeightLine } from "@/lib/format";
import { athletesList } from "@/lib/state-mock-data";
import { statePageMeta } from "@/lib/state-nav";

const meta = statePageMeta.athletes;
const filters = ["All sports", "District: All", "Age: All", "Rating ≥ 7.0"];

export default function AthletesPage() {
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

      <AcademyTable headers={["Athlete", "Sport · Batch", "District", "KhelSetu score", ""]} minWidth={640}>
        {athletesList.map((a) => (
          <TableRow key={a.name}>
            <TableCell>
              <div className="flex items-center gap-[11px]">
                <Avatar initials={a.initials} color={a.color} />
                <div>
                  <div className="font-semibold text-[13px] text-ink">{a.name}</div>
                  <div className="text-[11.5px] text-muted">{a.detail}</div>
                </div>
              </div>
            </TableCell>
            <TableCell>{formatSportWeightLine(a.sport)}</TableCell>
            <TableCell>{a.district}</TableCell>
            <TableCell><b className="text-[#0E9B72]">{a.rating}</b></TableCell>
            <TableCell><DotsIcon className="text-muted2" /></TableCell>
          </TableRow>
        ))}
      </AcademyTable>
    </PageBody>
  );
}
