"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AcademyTable,
  EmptyState,
  FilterPills,
  PageHeader,
  Pill,
  TableCell,
  TableRow,
} from "@/components/academy/shared";
import { InlineSelect } from "@/components/academy/InlineSelect";
import { CapIcon } from "@/components/academy/icons";
import { AcademyOnboardingRequestDetailModal } from "@/components/state/AcademyOnboardingRequestDetailModal";
import { HARYANA_DISTRICTS } from "@/lib/state-catalog";
import {
  ONBOARDING_STATUS_LABELS,
  onboardingStatusVariant,
  type AcademyOnboardingRequestDetail,
  type AcademyOnboardingRequestType,
  type AcademyOnboardingStatus,
  type StateOnboardingRequestListItem,
} from "@/lib/academy-onboarding";

type AcademyOnboardingRequestsWorkspaceProps = {
  requests: StateOnboardingRequestListItem[];
};

const STATUS_OPTIONS = [
  { value: "all", label: "Status: All" },
  { value: "submitted", label: "Status: Submitted" },
  { value: "under_review", label: "Status: Under review" },
  { value: "needs_action", label: "Status: Needs action" },
  { value: "approved", label: "Status: Approved" },
  { value: "rejected", label: "Status: Rejected" },
];

const TYPE_OPTIONS = [
  { value: "all", label: "Type: All" },
  { value: "initial", label: "Type: Initial" },
  { value: "resubmission", label: "Type: Resubmission" },
];

const TIME_OPTIONS = [
  { value: "all", label: "Time: All" },
  { value: "7", label: "Time: Last 7 days" },
  { value: "30", label: "Time: Last 30 days" },
  { value: "90", label: "Time: Last 90 days" },
];

const DISTRICT_OPTIONS = [
  { value: "all", label: "All districts" },
  ...HARYANA_DISTRICTS.map((district) => ({ value: district, label: district })),
];

function pillVariant(
  variant: StateOnboardingRequestListItem["statusVariant"]
): "green" | "amber" | "red" | "grey" {
  return variant;
}

export function AcademyOnboardingRequestsWorkspace({
  requests: initialRequests,
}: AcademyOnboardingRequestsWorkspaceProps) {
  const [requests, setRequests] = useState(initialRequests);
  const [statusFilter, setStatusFilter] = useState<AcademyOnboardingStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<AcademyOnboardingRequestType | "all">("all");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [detailId, setDetailId] = useState<string | null>(null);

  useEffect(() => {
    setRequests(initialRequests);
  }, [initialRequests]);

  function handleReviewed(updated: AcademyOnboardingRequestDetail) {
    setRequests((current) =>
      current.map((row) =>
        row.id === updated.id
          ? {
              ...row,
              status: updated.status,
              statusLabel: ONBOARDING_STATUS_LABELS[updated.status],
              statusVariant: onboardingStatusVariant(updated.status),
            }
          : row
      )
    );
  }

  const filtered = useMemo(() => {
    const now = Date.now();
    return requests.filter((request) => {
      if (statusFilter !== "all" && request.status !== statusFilter) return false;
      if (typeFilter !== "all" && request.requestType !== typeFilter) return false;
      if (districtFilter !== "all" && request.district !== districtFilter) return false;
      if (timeFilter !== "all" && request.submittedAt) {
        const days = Number.parseInt(timeFilter, 10);
        const cutoff = now - days * 24 * 60 * 60 * 1000;
        if (new Date(request.submittedAt).getTime() < cutoff) return false;
      }
      return true;
    });
  }, [requests, statusFilter, typeFilter, districtFilter, timeFilter]);

  return (
    <>
      <PageHeader
        title="Academy onboarding requests"
        subtitle={`${requests.length} verification request${requests.length === 1 ? "" : "s"} from academy admins`}
        action={
          <Link
            href="/state/nurseries"
            className="inline-flex items-center justify-center gap-[7px] border border-line bg-card text-ink font-semibold text-[13px] py-[11px] px-4 rounded-[10px] w-full sm:w-auto shrink-0"
          >
            Back to nurseries
          </Link>
        }
      />

      <FilterPills>
        <InlineSelect
          variant="pill"
          filterPill
          aria-label="Filter by time"
          value={timeFilter}
          onChange={setTimeFilter}
          active={timeFilter !== "all"}
          menuMaxHeightClass="max-h-52"
          className="shrink-0 text-[12.5px] font-medium px-[13px] py-2"
          options={TIME_OPTIONS}
        />
        <InlineSelect
          variant="pill"
          filterPill
          aria-label="Filter by request type"
          value={typeFilter}
          onChange={(value) => setTypeFilter(value as AcademyOnboardingRequestType | "all")}
          active={typeFilter !== "all"}
          className="shrink-0 text-[12.5px] font-medium px-[13px] py-2"
          options={TYPE_OPTIONS}
        />
        <InlineSelect
          variant="pill"
          filterPill
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(value) => setStatusFilter(value as AcademyOnboardingStatus | "all")}
          active={statusFilter !== "all"}
          className="shrink-0 text-[12.5px] font-medium px-[13px] py-2"
          options={STATUS_OPTIONS}
        />
        <InlineSelect
          variant="pill"
          filterPill
          aria-label="Filter by district"
          value={districtFilter}
          onChange={setDistrictFilter}
          active={districtFilter !== "all"}
          menuMaxHeightClass="max-h-52"
          className="shrink-0 text-[12.5px] font-medium px-[13px] py-2"
          options={DISTRICT_OPTIONS}
        />
      </FilterPills>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<CapIcon className="w-5 h-5" />}
          title="No onboarding requests match these filters"
          description="Try changing time, type, status, or district filters."
        />
      ) : (
        <AcademyTable
          headers={["Academy", "Admin", "District", "Type", "Submitted", "Status", ""]}
          minWidth={760}
        >
          {filtered.map((request) => (
            <TableRow key={request.id} onClick={() => setDetailId(request.id)}>
              <TableCell>
                <div className="font-semibold text-[13px] text-ink">{request.academyName}</div>
              </TableCell>
              <TableCell>{request.adminFullName}</TableCell>
              <TableCell>{request.district}</TableCell>
              <TableCell className="capitalize">{request.requestType}</TableCell>
              <TableCell>
                {request.submittedAt
                  ? new Date(request.submittedAt).toLocaleDateString("en-IN")
                  : "—"}
              </TableCell>
              <TableCell>
                <Pill variant={pillVariant(request.statusVariant)}>{request.statusLabel}</Pill>
              </TableCell>
              <TableCell>
                <span className="text-[11px] font-semibold text-brand">Review</span>
              </TableCell>
            </TableRow>
          ))}
        </AcademyTable>
      )}

      <AcademyOnboardingRequestDetailModal
        requestId={detailId}
        open={detailId != null}
        onClose={() => setDetailId(null)}
        onReviewed={handleReviewed}
      />
    </>
  );
}
