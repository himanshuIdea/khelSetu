"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AcademyTable,
  Avatar,
  PageHeader,
  Pill,
  TableCell,
  TableRow,
} from "@/components/academy/shared";
import { StateFilteredEmpty } from "@/components/state/StateEmptyStates";
import {
  GrantDisbursementModal,
  GrantStatusPill,
} from "@/components/state/funds/GrantDisbursementModal";
import { stateLayout } from "@/lib/state-layout";
import type { StateFundSchemeDetail } from "@/lib/state-portal";

type SchemeDisbursementWorkspaceProps = {
  detail: StateFundSchemeDetail;
};

export function SchemeDisbursementWorkspace({ detail: initialDetail }: SchemeDisbursementWorkspaceProps) {
  const router = useRouter();
  const [detail, setDetail] = useState(initialDetail);
  const [grantTarget, setGrantTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const { scheme } = detail;
  const beneficiaryType = scheme.beneficiaryType;

  const rows = useMemo(() => {
    if (beneficiaryType === "athlete") return detail.athleteBeneficiaries ?? [];
    if (beneficiaryType === "coach") return detail.coachBeneficiaries ?? [];
    return detail.nurseryBeneficiaries ?? [];
  }, [beneficiaryType, detail]);

  async function refreshDetail() {
    const { api } = await import("@/lib/api");
    const { detail: next } = await api.state.funds.schemeDetail(scheme.slug);
    setDetail(next);
    router.refresh();
  }

  return (
    <div className={stateLayout.listWorkspace}>
      <div className={stateLayout.listChrome}>
        <PageHeader
          title={scheme.name}
          subtitle={`${scheme.detail} · FY ${detail.fiscalYearLabel} · ${scheme.disbursed} disbursed of ${scheme.allocated}`}
          action={
            <Link
              href="/state/funds"
              className="inline-flex items-center justify-center gap-[7px] bg-card border border-line text-ink font-semibold text-[13px] py-[11px] px-4 rounded-[10px] w-full sm:w-auto shrink-0"
            >
              Back to funds
            </Link>
          }
        />

        <div className="flex flex-wrap gap-2 mb-3">
          <Pill variant="grey">{scheme.beneficiaries} beneficiaries paid</Pill>
          <Pill variant="grey">{scheme.util}% utilised</Pill>
        </div>
      </div>

      <div className={stateLayout.listScrollRegion}>
        {rows.length === 0 ? (
          <StateFilteredEmpty
            entity="beneficiaries"
            description="Registered nurseries need athletes, coaches, or academies before grants can be issued."
          />
        ) : beneficiaryType === "athlete" ? (
          <AcademyTable
            scrollable
            headers={["Athlete", "Sport", "District", "Nursery", "Grant", ""]}
          >
            {(detail.athleteBeneficiaries ?? []).map((row) => (
              <TableRow key={row.id}>
                <TableCell className="pl-0">
                  <div className="flex items-center gap-2.5">
                    <Avatar initials={row.initials} color={row.color} />
                    <div>
                      <div className="font-semibold text-[13px] text-ink">{row.name}</div>
                      <div className="text-[11.5px] text-muted">{row.detail}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{row.sport}</TableCell>
                <TableCell>{row.district}</TableCell>
                <TableCell>{row.nurseryName}</TableCell>
                <TableCell>
                  <GrantStatusPill status={row.grant.status} amountPaise={row.grant.amountPaise} />
                </TableCell>
                <TableCell className="pr-0 text-right">
                  <button
                    type="button"
                    onClick={() => setGrantTarget({ id: row.id, name: row.name })}
                    className="text-[12px] font-semibold text-brand hover:underline"
                  >
                    Grant
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </AcademyTable>
        ) : beneficiaryType === "coach" ? (
          <AcademyTable
            scrollable
            headers={["Coach", "Sport", "District", "Nursery", "NIS", "Grant", ""]}
          >
            {(detail.coachBeneficiaries ?? []).map((row) => (
              <TableRow key={row.id}>
                <TableCell className="pl-0">
                  <div className="flex items-center gap-2.5">
                    <Avatar initials={row.initials} color={row.color} />
                    <div>
                      <div className="font-semibold text-[13px] text-ink">{row.name}</div>
                      <div className="text-[11.5px] text-muted">{row.detail}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{row.sport}</TableCell>
                <TableCell>{row.district}</TableCell>
                <TableCell>{row.nurseryName}</TableCell>
                <TableCell>{row.nisLevel}</TableCell>
                <TableCell>
                  <GrantStatusPill status={row.grant.status} amountPaise={row.grant.amountPaise} />
                </TableCell>
                <TableCell className="pr-0 text-right">
                  <button
                    type="button"
                    onClick={() => setGrantTarget({ id: row.id, name: row.name })}
                    className="text-[12px] font-semibold text-brand hover:underline"
                  >
                    Grant
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </AcademyTable>
        ) : (
          <AcademyTable
            scrollable
            headers={["Nursery", "District", "Sport", "Athletes", "Grant", ""]}
          >
            {(detail.nurseryBeneficiaries ?? []).map((row) => (
              <TableRow key={row.academyId}>
                <TableCell className="pl-0">
                  <div className="flex items-center gap-2.5">
                    <Avatar initials={row.initials} color={row.color} />
                    <div>
                      <div className="font-semibold text-[13px] text-ink">{row.name}</div>
                      <div className="text-[11.5px] text-muted">{row.detail}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{row.district}</TableCell>
                <TableCell>{row.sportLabel}</TableCell>
                <TableCell>{row.athletes}</TableCell>
                <TableCell>
                  <GrantStatusPill status={row.grant.status} amountPaise={row.grant.amountPaise} />
                </TableCell>
                <TableCell className="pr-0 text-right">
                  <button
                    type="button"
                    onClick={() => setGrantTarget({ id: row.academyId, name: row.name })}
                    className="text-[12px] font-semibold text-brand hover:underline"
                  >
                    Grant
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </AcademyTable>
        )}
      </div>

      <GrantDisbursementModal
        open={grantTarget != null}
        onClose={() => setGrantTarget(null)}
        schemeSlug={scheme.slug}
        beneficiaryId={grantTarget?.id ?? ""}
        beneficiaryName={grantTarget?.name ?? ""}
        onGranted={refreshDetail}
      />
    </div>
  );
}
