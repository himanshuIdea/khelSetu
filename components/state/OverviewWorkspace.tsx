"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BellIcon, ChartIcon, UpIcon } from "@/components/academy/icons";
import {
  Avatar,
  Pill,
  SectionTitle,
  StatCard,
  TableCell,
  TableRow,
} from "@/components/academy/shared";
import { StateSectionEmpty } from "@/components/state/StateEmptyStates";
import { StateOverviewLoading } from "@/components/state/StateRouteLoading";
import {
  FillBarRow,
  SportLegend,
  StackedBarRow,
  StateGhostButton,
} from "@/components/state/shared";
import { api } from "@/lib/api";
import { formatCompactCount, formatSportWeightLine } from "@/lib/format";
import {
  talentPipelineInitials,
  verificationDonutSegments,
} from "@/lib/state-overview-ui";
import { statePageMeta } from "@/lib/state-nav";
import type { StateOverviewData } from "@/lib/state-portal";

const meta = statePageMeta.overview;
const FETCH_SLOW_MS = 45_000;

export function OverviewWorkspace() {
  const [data, setData] = useState<StateOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const slowTimerRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSlow(false);

    if (slowTimerRef.current) {
      window.clearTimeout(slowTimerRef.current);
    }
    slowTimerRef.current = window.setTimeout(() => setSlow(true), FETCH_SLOW_MS);

    try {
      const { data: next } = await api.state.overview.get();
      setData(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load state overview.");
      setData(null);
    } finally {
      if (slowTimerRef.current) {
        window.clearTimeout(slowTimerRef.current);
        slowTimerRef.current = null;
      }
      setLoading(false);
      setSlow(false);
    }
  }, []);

  useEffect(() => {
    void load();
    return () => {
      if (slowTimerRef.current) {
        window.clearTimeout(slowTimerRef.current);
      }
    };
  }, [load]);

  if (loading && !data) {
    return (
      <>
        {slow && (
          <div className="mb-3 text-[13px] text-muted bg-surface border border-line rounded-[10px] px-3 py-2">
            Dashboard is taking longer than usual.{" "}
            <button
              type="button"
              onClick={() => void load()}
              className="font-semibold text-brand underline"
            >
              Retry
            </button>{" "}
            or{" "}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="font-semibold text-brand underline"
            >
              reload the page
            </button>
            .
          </div>
        )}
        <StateOverviewLoading />
      </>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <h2 className="text-lg font-bold text-ink">Could not load dashboard</h2>
        <p className="text-[13px] text-muted mt-2 max-w-md">{error}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-6 min-h-[44px] px-5 rounded-[10px] bg-brand text-white text-[13px] font-semibold"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { summary, verification, districtBars, sportLegend, talentPipeline, fundUtilisation, hasData } =
    data;

  const donut = verificationDonutSegments(verification);
  const hasDistrictData = districtBars.length > 0;
  const hasTalentData = talentPipeline.length > 0;
  const hasFundUtilisation = fundUtilisation.rows.length > 0;

  return (
    <>
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
                  segments={row.segments}
                  colors={sportLegend.map((s) => s.color)}
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
                  prefetch={false}
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
    </>
  );
}
