import { UpIcon } from "@/components/academy/icons";
import {
  Avatar,
  PageBody,
  PageHeader,
  Pill,
  SectionTitle,
  StatCard,
  StatGrid,
  TableCell,
  TableRow,
} from "@/components/academy/shared";
import { FillBarRow } from "@/components/state/shared";
import { formatSportWeightLine } from "@/lib/format";
import { scoutingProspects } from "@/lib/state-mock-data";
import { statePageMeta } from "@/lib/state-nav";

const meta = statePageMeta.scouting;
const filters = [
  "Sport: Wrestling",
  "Age: Sub-junior",
  "District: All 22",
  "Rating ≥ 8.0",
  "Khelo India ready",
];

export default function ScoutingPage() {
  return (
    <PageBody>
      <PageHeader title={meta.title} subtitle={meta.subtitle} actionLabel={meta.actionLabel!} actionIcon={<UpIcon />} />

      <div className="flex flex-wrap gap-2 mb-3.5">
        {filters.map((f, i) => (
          <Pill key={f} variant={i === filters.length - 1 ? "brand" : "grey"} className="px-3 py-[7px]">
            {f.split(": ").map((part, j) =>
              j === 0 ? (
                <span key={j}>{part}: </span>
              ) : (
                <b key={j} className="text-text ml-0.5">{part}</b>
              )
            )}
          </Pill>
        ))}
      </div>

      <StatGrid>
        <StatCard compact value="5,840" label="Prospects identified" />
        <StatCard compact value="412" label="Shortlisted · Khelo India" valueColor="#C77F12" />
        <StatCard compact value="168" label="In state training camps" />
        <StatCard compact value="23%" label="Reached national camp" valueColor="#0E9B72" />
      </StatGrid>

      <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-3.5">
        <div className="bg-card border border-line rounded-(--radius) px-[18px] py-3.5 overflow-x-auto">
          <div className="flex justify-between items-center mb-1 pr-3">
            <SectionTitle title="Top prospects this quarter" subtitle="ranked by KhelSetu score" />
          </div>
          <table className="w-full border-collapse min-w-[560px]">
            <thead>
              <tr>
                {["Athlete", "Sport", "District", "Score", "Status"].map((h) => (
                  <th key={h} className="text-left text-[10.5px] tracking-[0.6px] uppercase text-muted2 font-semibold px-3.5 pb-[11px]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scoutingProspects.map((p) => (
                <TableRow key={p.name}>
                  <TableCell className="pl-0">
                    <div className="flex items-center gap-[11px]">
                      <Avatar initials={p.initials} color={p.color} size="sm" />
                      <div>
                        <div className="font-semibold text-[13px] text-ink">{p.name}</div>
                        <div className="text-[11.5px] text-muted">{formatSportWeightLine(p.detail)}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{p.sport}</TableCell>
                  <TableCell>{p.district}</TableCell>
                  <TableCell><b className="text-[#0E9B72]">{p.score}</b></TableCell>
                  <TableCell><Pill variant={p.status}>{p.statusLabel}</Pill></TableCell>
                </TableRow>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-card border border-line rounded-(--radius) px-[18px] py-4">
          <SectionTitle title="Talent pipeline" />
          <div className="mt-3.5">
            <FillBarRow label="Identified" value="5,840" percent={100} color="#FF6B2C" labelWidth="w-24" />
            <FillBarRow label="In trials" value="1,240" percent={64} color="#F5A623" labelWidth="w-24" />
            <FillBarRow label="State camp" value="412" percent={38} color="#2F6BFF" labelWidth="w-24" />
            <FillBarRow label="National camp" value="96" percent={18} color="#12B886" labelWidth="w-24" />
          </div>
          <div className="border-t border-line2 pt-[11px] mt-3.5">
            <div className="text-[11.5px] text-muted mb-2">By age group</div>
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[11.5px] text-muted"><span className="w-[7px] h-[7px] rounded-full bg-brand" />Sub-junior (U-15)<b className="ml-auto text-text">2,910</b></div>
              <div className="flex items-center gap-1.5 text-[11.5px] text-muted"><span className="w-[7px] h-[7px] rounded-full bg-blue" />Junior (U-18)<b className="ml-auto text-text">1,985</b></div>
              <div className="flex items-center gap-1.5 text-[11.5px] text-muted"><span className="w-[7px] h-[7px] rounded-full bg-purple" />Senior<b className="ml-auto text-text">945</b></div>
            </div>
          </div>
        </div>
      </div>
    </PageBody>
  );
}
