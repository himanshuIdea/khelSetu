import Link from "next/link";
import { BellIcon, ChartIcon, UpIcon } from "@/components/academy/icons";
import {
  Avatar,
  PageHeader,
  Pill,
  SectionTitle,
  StatCard,
  TableCell,
  TableRow,
} from "@/components/academy/shared";
import { StatePageBody } from "@/components/state/StatePageBody";
import { StateSectionEmpty } from "@/components/state/StateEmptyStates";
import {
  FillBarRow,
  SportLegend,
  StackedBarRow,
  StateGhostButton,
} from "@/components/state/shared";
import { formatCompactCount, formatSportWeightLine } from "@/lib/format";
import {
  getStateOverview,
  talentPipelineInitials,
  verificationDonutSegments,
} from "@/lib/repositories/state-aggregates";
import { statePageMeta } from "@/lib/state-nav";

const meta = statePageMeta.overview;

export default async function StateOverviewPage() {
  const data = await getStateOverview();
  const { summary, verification, districtBars, sportLegend, talentPipeline, fundUtilisation, hasData } =
    data;

  const donut = verificationDonutSegments(verification);
  const hasDistrictData = districtBars.length > 0;
  const hasTalentData = talentPipeline.length > 0;
  const hasFundUtilisation = fundUtilisation.rows.length > 0;

  return (
    <StatePageBody>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-3.5">
        <div>
          <h1 className="text-xl sm:text-[21px] font-bold text-ink tracking-[-0.3px]">{meta.title}</h1>
          <p className="text-[13px] text-muted mt-[3px]">
            {hasData
              ? `Aggregated across ${summary.nurseryCount} nurseries and ${formatCompactCount(summary.athleteCount)} athletes`
              : "Statewide metrics will populate as nurseries and athletes are registered"}
          </p>
        </div>
        {hasData && (
          <StateGhostButton icon={<ChartIcon className="w-4 h-4" />}>
            {meta.actionLabel}
          </StateGhostButton>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 mb-4">
        <StatCard
          compact
          value={hasData ? summary.nurseryCount.toLocaleString("en-IN") : "0"}
          label="Sports nurseries"
          delta={
            hasData ? (
              <span className="text-green flex items-center gap-1">
                <UpIcon className="w-3 h-3" />
                statewide
              </span>
            ) : (
              <span className="text-muted">awaiting registrations</span>
            )
          }
        />
        <StatCard
          compact
          value={hasData ? formatCompactCount(summary.athleteCount) : "0"}
          label="Athletes tracked"
          delta={
            hasData ? (
              <span className="text-green flex items-center gap-1">
                <UpIcon className="w-3 h-3" />
                active roster
              </span>
            ) : (
              <span className="text-muted">no athletes yet</span>
            )
          }
        />
        <StatCard
          compact
          value={hasData ? `${verification.rate}%` : "—"}
          label="Nurseries verified"
          valueColor={hasData ? "#0E9B72" : undefined}
          delta={
            hasData ? (
              <span className="text-[#D63B3B] flex items-center gap-1">
                <BellIcon className="w-3 h-3" />
                {verification.flagged} flagged
              </span>
            ) : (
              <span className="text-muted">no reviews yet</span>
            )
          }
        />
        <StatCard
          compact
          value={fundUtilisation.totalDisbursed}
          label="Scholarships (DBT)"
          delta={
            fundUtilisation.rows.length > 0 ? (
              <span className="text-green flex items-center gap-1">
                <UpIcon className="w-3 h-3" />
                {fundUtilisation.rows[0].value} utilised
              </span>
            ) : (
              <span className="text-muted">no disbursements</span>
            )
          }
        />
        <StatCard
          compact
          value={hasData ? summary.coachCount.toLocaleString("en-IN") : "0"}
          label="NIS coaches"
          delta={
            <span className="text-muted">
              {hasData ? "across registered nurseries" : "not assigned"}
            </span>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-3.5 mb-3.5 min-w-0">
        <div className="bg-card border border-line rounded-(--radius) px-[18px] py-4 min-w-0">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-1.5">
            <SectionTitle title="Athletes by district, split by sport" />
            {hasDistrictData && (
              <Pill variant="grey">Top {districtBars.length} districts</Pill>
            )}
          </div>
          {hasDistrictData ? (
            <>
              <SportLegend items={sportLegend} />
              {districtBars.map((row) => (
                <StackedBarRow
                  key={row.district}
                  label={row.district}
                  total={row.total}
                  widthPercent={row.widthPercent}
                  segments={row.segments}
                />
              ))}
            </>
          ) : (
            <StateSectionEmpty screen="overview-districts" />
          )}
        </div>

        <div className="bg-card border border-line rounded-(--radius) px-[18px] py-4 min-w-0">
          <SectionTitle title="Nursery verification" />
          {hasData ? (
            <>
              <div className="flex items-center gap-4 mt-3">
                <svg width="118" height="118" viewBox="0 0 128 128" className="shrink-0">
                  <g transform="rotate(-90 64 64)" fill="none" strokeWidth="17">
                    <circle cx="64" cy="64" r="54" stroke="#12B886" strokeDasharray={donut.verifiedDash} />
                    <circle
                      cx="64"
                      cy="64"
                      r="54"
                      stroke="#F5A623"
                      strokeDasharray={donut.pendingDash}
                      strokeDashoffset={donut.verifiedOffset}
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="54"
                      stroke="#EF4444"
                      strokeDasharray={donut.flaggedDash}
                      strokeDashoffset={donut.flaggedOffset}
                    />
                  </g>
                  <text x="64" y="60" textAnchor="middle" fontSize="23" fontWeight="700" fill="#0E1B33" fontFamily="Poppins">
                    {verification.rate}%
                  </text>
                  <text x="64" y="78" textAnchor="middle" fontSize="9" fill="#6B7790" fontFamily="Poppins">
                    verified
                  </text>
                </svg>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-1.5 text-[11.5px] text-muted">
                    <span className="w-[7px] h-[7px] rounded-full bg-green" />
                    Verified <b className="ml-auto text-text">{verification.verified}</b>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11.5px] text-muted">
                    <span className="w-[7px] h-[7px] rounded-full bg-amber" />
                    Pending <b className="ml-auto text-text">{verification.pending}</b>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11.5px] text-muted">
                    <span className="w-[7px] h-[7px] rounded-full bg-red" />
                    Flagged <b className="ml-auto text-text">{verification.flagged}</b>
                  </div>
                </div>
              </div>
              {verification.flagged > 0 && (
                <Link
                  href="/state/verification?status=flagged"
                  className="mt-3 bg-red-soft border border-[#F6D4D4] rounded-[10px] px-[11px] py-[9px] flex items-center gap-2 hover:bg-[#FEF2F2] transition-colors"
                >
                  <BellIcon className="w-[15px] h-[15px] text-[#D63B3B]" />
                  <span className="text-[11px] text-[#B5392F]">
                    <b>{verification.flagged} nurseries flagged</b> — review verification queue
                  </span>
                </Link>
              )}
            </>
          ) : (
            <StateSectionEmpty screen="overview-verification" />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-3.5 min-w-0">
        <div className="bg-card border border-line rounded-(--radius) px-[18px] py-3.5 overflow-x-auto min-w-0">
          <div className="flex justify-between items-center mb-1 pr-3">
            <SectionTitle title="Talent pipeline · flagged for Khelo India" />
            {hasTalentData && <Pill variant="brand">Auto-shortlist</Pill>}
          </div>
          {hasTalentData ? (
            <table className="w-full border-collapse min-w-[480px]">
              <tbody>
                {talentPipeline.map((row) => (
                  <TableRow key={`${row.name}-${row.district}`}>
                    <TableCell className="pl-0">
                      <div className="flex items-center gap-[11px]">
                        <Avatar
                          initials={talentPipelineInitials(row.name)}
                          color={row.avatarColor}
                          size="sm"
                        />
                        <div>
                          <div className="font-semibold text-[13px] text-ink">{row.name}</div>
                          <div className="text-[11.5px] text-muted">{formatSportWeightLine(row.sport)}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{row.district}</TableCell>
                    <TableCell>
                      <Pill variant="grey">{row.category}</Pill>
                    </TableCell>
                    <TableCell>
                      <b className="text-[#0E9B72]">{row.score}</b>{" "}
                      <UpIcon className="inline w-[11px] h-[11px] text-green align-[-1px]" />
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </table>
          ) : (
            <StateSectionEmpty screen="overview-talent" />
          )}
        </div>

        <div className="bg-card border border-line rounded-(--radius) px-[18px] py-4 min-w-0">
          <div className="flex justify-between items-center mb-3.5">
            <SectionTitle title="Fund utilisation" />
            {hasFundUtilisation && (
              <span className="text-[11.5px] text-muted">FY 2026-27</span>
            )}
          </div>
          {hasFundUtilisation ? (
            <>
              {fundUtilisation.rows.map((row) => (
                <FillBarRow
                  key={row.label}
                  label={row.label}
                  value={row.value}
                  percent={row.percent}
                  color={row.color}
                  labelWidth="w-[118px]"
                />
              ))}
              <div className="border-t border-line2 pt-[11px] mt-3.5">
                <div className="text-lg font-bold text-ink">{fundUtilisation.totalDisbursed}</div>
                <div className="text-[11.5px] text-muted">disbursed via DBT</div>
              </div>
            </>
          ) : (
            <StateSectionEmpty screen="overview-funds" />
          )}
        </div>
      </div>
    </StatePageBody>
  );
}
