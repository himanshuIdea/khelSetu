"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AcademyCardList,
  AcademyCardListItem,
  AcademyTable,
  Avatar,
  FilterPills,
  PageHeader,
  Pill,
  SectionTitle,
  StatCard,
  StatGrid,
  TableCell,
  TableRow,
} from "@/components/academy/shared";
import { InlineSelect } from "@/components/academy/InlineSelect";
import { AcademyOnboardingRequestDetailModal } from "@/components/state/AcademyOnboardingRequestDetailModal";
import { StateFilteredEmpty, StateSectionEmpty } from "@/components/state/StateEmptyStates";
import { VerificationNurseryModal } from "@/components/state/VerificationNurseryModal";
import type { AcademyOnboardingRequestDetail } from "@/lib/academy-onboarding";
import {
  ONBOARDING_STATUS_LABELS,
  onboardingStatusVariant,
} from "@/lib/academy-onboarding";
import { HARYANA_DISTRICTS } from "@/lib/state-catalog";
import { stateLayout } from "@/lib/state-layout";
import { statePageMeta } from "@/lib/state-nav";
import type { VerificationBreakdown } from "@/lib/state-portal";
import {
  verificationQueueStatusLabel,
  verificationQueueStatusVariant,
  isPendingReviewQueueItem,
  type VerificationQueueItem,
} from "@/lib/state-verification-queue";

type VerificationWorkspaceProps = {
  queue: VerificationQueueItem[];
  breakdown: VerificationBreakdown;
  initialFlaggedOnly?: boolean;
};

const meta = statePageMeta.verification;

const QUEUE_TYPE_OPTIONS = [
  { value: "all", label: "Type: All" },
  { value: "onboarding", label: "Type: Onboarding" },
  { value: "nursery", label: "Type: Registered" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "Status: All" },
  { value: "submitted", label: "Status: Submitted" },
  { value: "needs_action", label: "Status: Needs action" },
  { value: "under_review", label: "Status: Under review" },
  { value: "rejected", label: "Status: Rejected" },
  { value: "verified", label: "Status: Verified" },
  { value: "pending", label: "Status: Pending" },
  { value: "flagged", label: "Status: Flagged" },
  { value: "review_requested", label: "Status: Review requested" },
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

function rowKey(item: VerificationQueueItem): string {
  return item.kind === "onboarding" ? item.id : item.academyId;
}

function matchesFilters(
  item: VerificationQueueItem,
  queueType: string,
  statusFilter: string,
  districtFilter: string,
  timeFilter: string
): boolean {
  if (queueType === "onboarding" && item.kind !== "onboarding") return false;
  if (queueType === "nursery" && item.kind !== "nursery") return false;

  if (districtFilter !== "all" && item.district !== districtFilter) return false;

  if (statusFilter !== "all") {
    if (statusFilter === "pending") {
      if (!isPendingReviewQueueItem(item)) return false;
    } else if (item.kind === "onboarding") {
      if (statusFilter === "review_requested") return false;
      if (["verified", "pending", "flagged"].includes(statusFilter)) return false;
      if (item.status !== statusFilter) return false;
    } else if (statusFilter === "review_requested") {
      if (item.flagResponseStatus !== "review_requested") return false;
    } else if (["verified", "pending", "flagged"].includes(statusFilter)) {
      if (item.verificationStatus !== statusFilter) return false;
    } else {
      return false;
    }
  }

  if (timeFilter !== "all") {
    const days = Number.parseInt(timeFilter, 10);
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const dateStr = item.kind === "onboarding" ? item.submittedAt : item.registeredAt;
    if (!dateStr || new Date(dateStr).getTime() < cutoff) return false;
  }

  return true;
}

function QueueRowContent({ item }: { item: VerificationQueueItem }) {
  const statusVariant = verificationQueueStatusVariant(item);
  const statusLabel = verificationQueueStatusLabel(item);

  return (
    <>
      <TableCell>
        <div className="flex items-center gap-[11px] min-w-0">
          <Avatar initials={item.initials} color={item.color} />
          <div className="font-semibold text-[13px] text-ink truncate">{item.name}</div>
        </div>
      </TableCell>
      <TableCell>{item.adminFullName}</TableCell>
      <TableCell>{item.district}</TableCell>
      <TableCell>{item.queueTypeLabel}</TableCell>
      <TableCell>{item.kind === "nursery" ? item.athleteCount : "—"}</TableCell>
      <TableCell>
        <Pill variant={statusVariant}>{statusLabel}</Pill>
      </TableCell>
      <TableCell>
        <span className="text-[11px] font-semibold text-brand">
          {item.kind === "onboarding" || (item.kind === "nursery" && item.verificationStatus === "pending")
            ? "Review"
            : "Manage"}
        </span>
      </TableCell>
    </>
  );
}

export function VerificationWorkspace({
  queue: initialQueue,
  breakdown,
  initialFlaggedOnly = false,
}: VerificationWorkspaceProps) {
  const [queue, setQueue] = useState(initialQueue);
  const [queueType, setQueueType] = useState<"all" | "onboarding" | "nursery">("all");
  const [statusFilter, setStatusFilter] = useState(
    initialFlaggedOnly ? "flagged" : "all"
  );
  const [districtFilter, setDistrictFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [onboardingId, setOnboardingId] = useState<string | null>(null);
  const [nurseryId, setNurseryId] = useState<string | null>(null);

  useEffect(() => {
    setQueue(initialQueue);
  }, [initialQueue]);

  const hasItems = queue.length > 0;
  const subtitle = hasItems
    ? `${breakdown.verified} verified · ${breakdown.pending} pending · ${breakdown.flagged} flagged`
    : "Verification queue populates when academies submit onboarding requests";

  const filtered = useMemo(
    () =>
      queue.filter((item) =>
        matchesFilters(item, queueType, statusFilter, districtFilter, timeFilter)
      ),
    [queue, queueType, statusFilter, districtFilter, timeFilter]
  );

  function handleRowClick(item: VerificationQueueItem) {
    if (item.kind === "onboarding") {
      setOnboardingId(item.id);
      return;
    }
    if (item.onboardingRequestId) {
      setOnboardingId(item.onboardingRequestId);
      return;
    }
    setNurseryId(item.academyId);
  }

  function handleReviewed(updated: AcademyOnboardingRequestDetail) {
    if (updated.status === "approved") {
      setQueue((current) => current.filter((row) => row.kind !== "onboarding" || row.id !== updated.id));
      return;
    }

    setQueue((current) =>
      current.map((row) =>
        row.kind === "onboarding" && row.id === updated.id
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

  function handleReviewFlagged() {
    setQueueType("nursery");
    setStatusFilter("flagged");
  }

  return (
    <div className={stateLayout.listWorkspace}>
      <div className={stateLayout.listChrome}>
        <PageHeader
          title={meta.title}
          subtitle={subtitle}
          actionLabel={hasItems && breakdown.flagged > 0 ? meta.actionLabel : undefined}
          onActionClick={handleReviewFlagged}
        />

        <StatGrid>
          <StatCard
            compact
            value={hasItems ? breakdown.verified.toLocaleString("en-IN") : "0"}
            label="Verified"
            valueColor={hasItems ? "#0E9B72" : undefined}
          />
          <StatCard
            compact
            value={hasItems ? breakdown.pending.toLocaleString("en-IN") : "0"}
            label="Pending review"
            valueColor={hasItems ? "#C77F12" : undefined}
          />
          <StatCard
            compact
            value={hasItems ? breakdown.flagged.toLocaleString("en-IN") : "0"}
            label="Flagged"
            valueColor={hasItems ? "#D63B3B" : undefined}
          />
          <StatCard
            compact
            value={hasItems ? `${breakdown.rate}%` : "—"}
            label="Overall verification rate"
            valueColor={hasItems ? "#0E9B72" : undefined}
          />
        </StatGrid>

        {hasItems && (
          <FilterPills>
            <InlineSelect
              variant="pill"
              filterPill
              aria-label="Filter by queue type"
              value={queueType}
              onChange={(value) => setQueueType(value as typeof queueType)}
              active={queueType !== "all"}
              className="shrink-0 text-[12.5px] font-medium px-[13px] py-2"
              options={QUEUE_TYPE_OPTIONS}
            />
            <InlineSelect
              variant="pill"
              filterPill
              aria-label="Filter by status"
              value={statusFilter}
              onChange={setStatusFilter}
              active={statusFilter !== "all"}
              menuMaxHeightClass="max-h-52"
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
          </FilterPills>
        )}
      </div>

      <div className={`${stateLayout.listScrollRegion} mt-4`}>
        <div className="flex flex-col flex-1 min-h-0 bg-card border border-line rounded-(--radius) overflow-hidden min-w-0">
          <div className="shrink-0 px-[18px] pt-4 pb-1">
            <SectionTitle
              title="Verification queue"
              subtitle="onboarding requests and registered nurseries"
            />
          </div>

          {!hasItems ? (
            <StateSectionEmpty screen="verification" />
          ) : filtered.length === 0 ? (
            <StateFilteredEmpty
              entity="queue items"
              description="Try changing type, status, district, or time filters."
            />
          ) : (
            <>
              <AcademyCardList scrollable className="border-0 shadow-none rounded-none">
                {filtered.map((item) => {
                  const statusVariant = verificationQueueStatusVariant(item);
                  const statusLabel = verificationQueueStatusLabel(item);
                  const highlighted =
                    item.kind === "nursery" && item.verificationStatus === "flagged";

                  return (
                    <AcademyCardListItem
                      key={rowKey(item)}
                      highlighted={highlighted}
                      onClick={() => handleRowClick(item)}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <Avatar initials={item.initials} color={item.color} />
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-[13px] text-ink truncate">
                            {item.name}
                          </div>
                          <div className="text-[11.5px] text-muted mt-0.5">
                            {item.adminFullName} · {item.district}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <Pill variant="grey">{item.queueTypeLabel}</Pill>
                            <Pill variant={statusVariant}>{statusLabel}</Pill>
                          </div>
                        </div>
                      <span className="text-[11px] font-semibold text-brand shrink-0">
                        {item.kind === "onboarding" ||
                        (item.kind === "nursery" && item.verificationStatus === "pending")
                          ? "Review"
                          : "Manage"}
                      </span>
                      </div>
                    </AcademyCardListItem>
                  );
                })}
              </AcademyCardList>

              <AcademyTable
                scrollable
                className="hidden lg:flex border-0 shadow-none rounded-none"
                headers={["Nursery", "Admin", "District", "Type", "Athletes", "Status", ""]}
                minWidth={760}
              >
                {filtered.map((item) => (
                  <TableRow
                    key={rowKey(item)}
                    highlighted={item.kind === "nursery" && item.verificationStatus === "flagged"}
                    onClick={() => handleRowClick(item)}
                  >
                    <QueueRowContent item={item} />
                  </TableRow>
                ))}
              </AcademyTable>
            </>
          )}
        </div>
      </div>

      <AcademyOnboardingRequestDetailModal
        requestId={onboardingId}
        open={onboardingId != null}
        onClose={() => setOnboardingId(null)}
        onReviewed={handleReviewed}
      />

      <VerificationNurseryModal
        academyId={nurseryId}
        open={nurseryId != null}
        onClose={() => setNurseryId(null)}
      />
    </div>
  );
}
