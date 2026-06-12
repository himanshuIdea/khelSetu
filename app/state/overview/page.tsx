import { BellIcon, ChartIcon, UpIcon } from "@/components/academy/icons";
import {
  Avatar,
  PageBody,
  Pill,
  SectionTitle,
  StatCard,
  StatGrid,
  TableCell,
  TableRow,
} from "@/components/academy/shared";
import { FillBarRow, SportLegend, StackedBarRow, StateGhostButton } from "@/components/state/shared";
import { formatSportWeightLine } from "@/lib/format";
import { stateDistrictBars, talentPipeline } from "@/lib/state-mock-data";
import { statePageMeta } from "@/lib/state-nav";

const meta = statePageMeta.overview;

export default function StateOverviewPage() {
  return (
    <PageBody>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-3.5">
        <div>
          <h1 className="text-xl sm:text-[21px] font-bold text-ink tracking-[-0.3px]">{meta.title}</h1>
          <p className="text-[13px] text-muted mt-[3px]">{meta.subtitle}</p>
        </div>
        <StateGhostButton icon={<ChartIcon className="w-4 h-4" />}>
          {meta.actionLabel}
        </StateGhostButton>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 mb-4">
        <StatCard compact value="1,842" label="Sports nurseries" delta={<span className="text-green flex items-center gap-1"><UpIcon className="w-3 h-3" />+184 this season</span>} />
        <StatCard compact value="1.24 L" label="Athletes tracked" delta={<span className="text-green flex items-center gap-1"><UpIcon className="w-3 h-3" />+9.2k</span>} />
        <StatCard compact value="96%" label="Nurseries verified" valueColor="#0E9B72" delta={<span className="text-[#D63B3B] flex items-center gap-1"><BellIcon className="w-3 h-3" />22 flagged</span>} />
        <StatCard compact value="₹38.6 Cr" label="Scholarships (DBT)" delta={<span className="text-green flex items-center gap-1"><UpIcon className="w-3 h-3" />82% utilised</span>} />
        <StatCard compact value="3,210" label="NIS coaches" delta={<span className="text-muted">across 36 sports</span>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-3.5 mb-3.5">
        <div className="bg-card border border-line rounded-(--radius) px-[18px] py-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-1.5">
            <SectionTitle title="Athletes by district, split by sport" />
            <Pill variant="grey">Top 6 of 22</Pill>
          </div>
          <SportLegend />
          {stateDistrictBars.map((row) => (
            <StackedBarRow
              key={row.district}
              label={row.district}
              total={row.total}
              widthPercent={row.width}
              segments={row.segments}
            />
          ))}
        </div>

        <div className="bg-card border border-line rounded-(--radius) px-[18px] py-4">
          <SectionTitle title="Nursery verification" />
          <div className="flex items-center gap-4 mt-3">
            <svg width="118" height="118" viewBox="0 0 128 128" className="shrink-0">
              <g transform="rotate(-90 64 64)" fill="none" strokeWidth="17">
                <circle cx="64" cy="64" r="54" stroke="#12B886" strokeDasharray="325.4 13.9" />
                <circle cx="64" cy="64" r="54" stroke="#F5A623" strokeDasharray="9.5 329.8" strokeDashoffset="-325.4" />
                <circle cx="64" cy="64" r="54" stroke="#EF4444" strokeDasharray="4.1 335.2" strokeDashoffset="-334.9" />
              </g>
              <text x="64" y="60" textAnchor="middle" fontSize="23" fontWeight="700" fill="#0E1B33" fontFamily="Poppins">96%</text>
              <text x="64" y="78" textAnchor="middle" fontSize="9" fill="#6B7790" fontFamily="Poppins">verified</text>
            </svg>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-1.5 text-[11.5px] text-muted"><span className="w-[7px] h-[7px] rounded-full bg-green" />Verified <b className="ml-auto text-text">1,768</b></div>
              <div className="flex items-center gap-1.5 text-[11.5px] text-muted"><span className="w-[7px] h-[7px] rounded-full bg-amber" />Pending <b className="ml-auto text-text">52</b></div>
              <div className="flex items-center gap-1.5 text-[11.5px] text-muted"><span className="w-[7px] h-[7px] rounded-full bg-red" />Flagged <b className="ml-auto text-text">22</b></div>
            </div>
          </div>
          <div className="mt-3 bg-red-soft border border-[#F6D4D4] rounded-[10px] px-[11px] py-[9px] flex items-center gap-2">
            <BellIcon className="w-[15px] h-[15px] text-[#D63B3B]" />
            <span className="text-[11px] text-[#B5392F]"><b>22 nurseries flagged</b> — low attendance / unverifiable rolls</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-3.5">
        <div className="bg-card border border-line rounded-(--radius) px-[18px] py-3.5 overflow-x-auto">
          <div className="flex justify-between items-center mb-1 pr-3">
            <SectionTitle title="Talent pipeline · flagged for Khelo India" />
            <Pill variant="brand">Auto-shortlist</Pill>
          </div>
          <table className="w-full border-collapse min-w-[480px]">
            <tbody>
              {talentPipeline.map((row) => (
                <TableRow key={row.name}>
                  <TableCell className="pl-0">
                    <div className="flex items-center gap-[11px]">
                      <Avatar initials={row.name.split(" ").map((n) => n[0]).join("")} color="#FF6B2C" size="sm" />
                      <div>
                        <div className="font-semibold text-[13px] text-ink">{row.name}</div>
                        <div className="text-[11.5px] text-muted">{formatSportWeightLine(row.sport)}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{row.district}</TableCell>
                  <TableCell><Pill variant="grey">{row.category}</Pill></TableCell>
                  <TableCell>
                    <b className="text-[#0E9B72]">{row.score}</b>{" "}
                    <UpIcon className="inline w-[11px] h-[11px] text-green align-[-1px]" />
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-card border border-line rounded-(--radius) px-[18px] py-4">
          <div className="flex justify-between items-center mb-3.5">
            <SectionTitle title="Fund utilisation" />
            <span className="text-[11.5px] text-muted">FY 2025-26</span>
          </div>
          <FillBarRow label="Scholarships" value="82%" percent={82} color="#12B886" labelWidth="w-[118px]" />
          <FillBarRow label="Diet allowance" value="76%" percent={76} color="#2F6BFF" labelWidth="w-[118px]" />
          <FillBarRow label="Coach honorarium" value="91%" percent={91} color="#F5A623" labelWidth="w-[118px]" />
          <div className="border-t border-line2 pt-[11px] mt-3.5 flex justify-between items-center">
            <div>
              <div className="text-lg font-bold text-ink">₹38.6 Cr</div>
              <div className="text-[11.5px] text-muted">disbursed via DBT</div>
            </div>
            <Pill variant="green">On track</Pill>
          </div>
        </div>
      </div>
    </PageBody>
  );
}
