"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CashIcon, UpIcon } from "@/components/academy/icons";
import {
  PageHeader,
  Pill,
  SectionTitle,
  StatCard,
  StatGrid,
  TableCell,
  TableRow,
} from "@/components/academy/shared";
import { SimpleConfirmDialog } from "@/components/academy/UnassignConfirmDialog";
import { StateSectionEmpty } from "@/components/state/StateEmptyStates";
import { useStatePageSearch } from "@/components/state/StateSearchContext";
import { EditAllocationModal } from "@/components/state/funds/EditAllocationModal";
import { api, ApiError } from "@/lib/api";
import { statePageMeta } from "@/lib/state-nav";
import { matchesStateTextSearch } from "@/lib/state-search";
import type { StateFundScheme, StateFundsDashboard } from "@/lib/state-portal";

type FundsWorkspaceProps = {
  dashboard: StateFundsDashboard;
};

const meta = statePageMeta.funds;

function utilColor(scheme: StateFundScheme): string {
  if (scheme.color === "#F5A623") return "#C77F12";
  if (scheme.color === "#2F6BFF") return "#2756D8";
  return "#0E9B72";
}

export function FundsWorkspace({ dashboard: initialDashboard }: FundsWorkspaceProps) {
  const router = useRouter();
  const searchQuery = useStatePageSearch();
  const [dashboard, setDashboard] = useState(initialDashboard);
  const [editScheme, setEditScheme] = useState<StateFundScheme | null>(null);
  const [releaseOpen, setReleaseOpen] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasSchemes = dashboard.schemes.length > 0;
  const filteredSchemes = useMemo(
    () =>
      dashboard.schemes.filter((scheme) =>
        matchesStateTextSearch(searchQuery, [scheme.name, scheme.detail])
      ),
    [dashboard.schemes, searchQuery]
  );
  const hasDisbursements =
    dashboard.beneficiariesPaid > 0 ||
    dashboard.pendingApproval > 0 ||
    dashboard.schemes.some((scheme) => scheme.disbursedPaise > 0);
  const hasAllocation = dashboard.totalAllocatedPaise > 0;

  async function refreshDashboard() {
    const { dashboard: next } = await api.state.funds.dashboard();
    setDashboard(next);
  }

  async function handleRelease() {
    setError(null);
    setReleasing(true);
    try {
      await api.state.funds.releasePending();
      setReleaseOpen(false);
      router.refresh();
      await refreshDashboard();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not release funds.");
    } finally {
      setReleasing(false);
    }
  }

  return (
    <>
      <PageHeader
        title={meta.title}
        subtitle={
          hasSchemes
            ? hasDisbursements
              ? `${dashboard.beneficiariesPaid.toLocaleString("en-IN")} beneficiaries paid via DBT · FY ${dashboard.fiscalYearLabel}`
              : `No disbursements yet · FY ${dashboard.fiscalYearLabel}`
            : `Set up FY ${dashboard.fiscalYearLabel} scheme allocations to begin disbursement`
        }
        action={
          hasSchemes ? (
            <button
              type="button"
              onClick={() => setReleaseOpen(true)}
              disabled={dashboard.pendingApproval === 0 || releasing}
              className="inline-flex items-center justify-center gap-[7px] bg-brand text-white font-semibold text-[13px] py-[11px] px-4 rounded-[10px] w-full sm:w-auto shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CashIcon />
              {meta.actionLabel}
            </button>
          ) : undefined
        }
      />

      {error && (
        <p className="text-[13px] text-[#D63B3B] mb-3" role="alert">
          {error}
        </p>
      )}

      <StatGrid>
        <StatCard
          compact
          value={dashboard.totalDisbursed}
          label="Disbursed via DBT"
          delta={
            hasDisbursements && hasAllocation ? (
              <span className="text-green flex items-center gap-1">
                <UpIcon className="w-3 h-3" />
                {dashboard.allocationPercent}% of allocation
              </span>
            ) : (
              <span className="text-muted">no disbursements yet</span>
            )
          }
        />
        <StatCard
          compact
          value={dashboard.beneficiariesPaid.toLocaleString("en-IN")}
          label="Beneficiaries paid"
        />
        <StatCard
          compact
          value={dashboard.pendingApproval.toLocaleString("en-IN")}
          label="Pending approval"
          valueColor={dashboard.pendingApproval > 0 ? "#C77F12" : undefined}
        />
        <StatCard
          compact
          value={hasDisbursements ? `${dashboard.paidOnTimeRate}%` : "—"}
          label="Paid on time"
          valueColor={hasDisbursements ? "#0E9B72" : undefined}
        />
      </StatGrid>

      <div className="bg-card border border-line rounded-(--radius) px-[18px] py-3.5 overflow-x-auto min-w-0 mt-4">
        <div className="flex justify-between items-center mb-1 pr-3">
          <SectionTitle title="Scheme-wise utilisation" subtitle="allocated vs disbursed" />
          {hasSchemes && (
            <Pill variant="grey" className="text-[11px]">
              FY {dashboard.fiscalYearLabel}
            </Pill>
          )}
        </div>
        {hasSchemes ? (
          filteredSchemes.length === 0 ? (
            <div className="py-8 text-center text-[13px] text-muted">
              No schemes match your search. Try a different term.
            </div>
          ) : (
          <table className="w-full border-collapse min-w-[560px]">
            <thead>
              <tr>
                {["Scheme", "Beneficiaries", "Allocated", "Disbursed", "Utilisation", ""].map(
                  (h) => (
                    <th
                      key={h || "actions"}
                      className="text-left text-[10.5px] tracking-[0.6px] uppercase text-muted2 font-semibold px-3.5 pb-[11px]"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {filteredSchemes.map((scheme) => (
                <TableRow
                  key={scheme.slug}
                  onClick={() => router.push(`/state/funds/${scheme.slug}`)}
                >
                  <TableCell className="pl-0">
                    <div className="font-semibold text-[13px] text-ink">{scheme.name}</div>
                    <div className="text-[11.5px] text-muted">{scheme.detail}</div>
                  </TableCell>
                  <TableCell>{scheme.beneficiaries}</TableCell>
                  <TableCell>{scheme.allocated}</TableCell>
                  <TableCell>{scheme.disbursed}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-[78px] h-[18px] bg-line2 rounded-md overflow-hidden">
                        <div
                          className="h-full rounded-md"
                          style={{ width: `${scheme.util}%`, background: scheme.color }}
                        />
                      </div>
                      <b className="text-xs" style={{ color: utilColor(scheme) }}>
                        {scheme.util}%
                      </b>
                    </div>
                  </TableCell>
                  <TableCell className="pr-0">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setEditScheme(scheme);
                      }}
                      className="text-[12px] font-semibold text-brand hover:underline"
                    >
                      Edit allocation
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </table>
          )
        ) : (
          <StateSectionEmpty screen="funds-schemes" />
        )}
      </div>

      <EditAllocationModal
        scheme={editScheme}
        open={editScheme != null}
        onClose={() => setEditScheme(null)}
        onSaved={async () => {
          setEditScheme(null);
          router.refresh();
          await refreshDashboard();
        }}
      />

      <SimpleConfirmDialog
        open={releaseOpen}
        title="Release pending funds?"
        description={`Mark ${dashboard.pendingApproval.toLocaleString("en-IN")} pending grant(s) as paid via DBT.`}
        isSubmitting={releasing}
        onConfirm={handleRelease}
        onCancel={() => setReleaseOpen(false)}
      />
    </>
  );
}
