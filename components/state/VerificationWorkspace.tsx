"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AcademyCardList,
  AcademyCardListItem,
  AcademyTable,
  Avatar,
  FilterPills,
  PageHeader,
  Pill,
  ScrollableListPanel,
  SectionTitle,
  StatCard,
  StatGrid,
  TableCell,
  TableRow,
} from "@/components/academy/shared";
import { InlineSelect } from "@/components/academy/InlineSelect";
import { AcademyOnboardingRequestDetailModal } from "@/components/state/AcademyOnboardingRequestDetailModal";
import { StateFilteredEmpty, StateSectionEmpty } from "@/components/state/StateEmptyStates";
import { useStatePageSearch } from "@/components/state/StateSearchContext";
import { VerificationNurseryModal } from "@/components/state/VerificationNurseryModal";
import type { AcademyOnboardingRequestDetail } from "@/lib/academy-onboarding";
import {
  ONBOARDING_STATUS_LABELS,
  onboardingStatusVariant,
} from "@/lib/academy-onboarding";
import { HARYANA_DISTRICTS } from "@/lib/state-catalog";
import { api } from "@/lib/api";
import { stateLayout } from "@/lib/state-layout";
import { statePageMeta } from "@/lib/state-nav";
import type { StateNurseryDetail } from "@/lib/state-nurseries";
import type { VerificationBreakdown } from "@/lib/state-portal";
import {
  verificationQueueStatusLabel,
  verificationQueueStatusVariant,
  isPendingReviewQueueItem,
  isReviewRequestedQueueItem,
  needsStateReviewAction,
  type VerificationQueueItem,
} from "@/lib/state-verification-queue";
import { matchesStateTextSearch } from "@/lib/state-search";

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
  { value: "addressed", label: "Status: Marked addressed" },
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

const TABLE_HEADERS = ["Nursery", "Admin", "District", "Athletes", "Status", ""] as const;

const TABLE_COLUMN_WIDTHS = ["30%", "28%", "14%", "8%", "12%", "8%"];

const TABLE_COLUMN_CLASS_NAMES = [
  "min-w-0",
  "min-w-0",
  "min-w-0",
  "text-right",
  "min-w-0",
  "m-0",
] as const;

const COMPACT_CELL = "py-2 sm:py-2.5";

function mobileSubtitle(item: VerificationQueueItem): string {
  const parts = [item.adminFullName, item.district];
  if (item.kind === "nursery") {
    parts.push(`${item.athleteCount} athletes`);
  }
  return parts.join(" · ");
}

function rowKey(item: VerificationQueueItem): string {
  return item.kind === "onboarding" ? item.id : item.academyId;
}

function isFlaggedNursery(item: VerificationQueueItem): boolean {
  return item.kind === "nursery" && item.verificationStatus === "flagged";
}

function flaggedRowTitle(item: VerificationQueueItem): string | undefined {
  if (!isFlaggedNursery(item)) return undefined;
  return "Flagged nursery — open to review flag details and clear or follow up";
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
    } else if (statusFilter === "review_requested") {
      if (!isReviewRequestedQueueItem(item)) return false;
    } else if (statusFilter === "addressed") {
      if (item.kind !== "nursery" || item.flagResponseStatus !== "addressed") return false;
    } else if (item.kind === "onboarding") {
      if (["verified", "pending", "flagged"].includes(statusFilter)) return false;
      if (item.status !== statusFilter) return false;
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

function matchesVerificationSearch(item: VerificationQueueItem, query: string): boolean {
  return matchesStateTextSearch(query, [
    item.name,
    item.adminFullName,
    item.district,
    item.queueTypeLabel,
    item.statusLabel,
    verificationQueueStatusLabel(item),
  ]);
}

function QueueRowContent({ item }: { item: VerificationQueueItem }) {
  const statusVariant = verificationQueueStatusVariant(item);
  const statusLabel = verificationQueueStatusLabel(item);
  const flagged = isFlaggedNursery(item);

  return (
    <>
      <TableCell className={`${COMPACT_CELL} ${TABLE_COLUMN_CLASS_NAMES[0]}`}>
        <div className="flex items-center gap-[11px] min-w-0">
          <Avatar initials={item.initials} color={item.color} />
          <div className="min-w-0 flex-1">
            <div
              className="font-semibold text-[13px] text-ink truncate group-hover:text-[#B5392F] transition-colors duration-150"
              title={item.name}
            >
              {item.name}
            </div>
            {flagged ? (
              <div className="mt-0.5 text-[10.5px] font-medium text-[#B5392F]/80 truncate opacity-90 group-hover:opacity-100 transition-opacity duration-150">
                State flag active — review required
              </div>
            ) : null}
          </div>
        </div>
      </TableCell>
      <TableCell className={`${COMPACT_CELL} ${TABLE_COLUMN_CLASS_NAMES[1]}`}>
        <div className="truncate" title={item.adminFullName}>
          {item.adminFullName}
        </div>
      </TableCell>
      <TableCell className={`${COMPACT_CELL} ${TABLE_COLUMN_CLASS_NAMES[2]}`}>
        <div className="truncate" title={item.district}>
          {item.district}
        </div>
      </TableCell>
      <TableCell className={`${COMPACT_CELL} ${TABLE_COLUMN_CLASS_NAMES[3]} tabular-nums`}>
        {item.kind === "nursery" ? item.athleteCount : "—"}
      </TableCell>
      <TableCell className={`${COMPACT_CELL} ${TABLE_COLUMN_CLASS_NAMES[4]}`}>
        <Pill variant={statusVariant} className="max-w-full min-w-0">
          <span className="truncate">{statusLabel}</span>
        </Pill>
      </TableCell>
      <TableCell className={`${COMPACT_CELL} ${TABLE_COLUMN_CLASS_NAMES[5]}`}>
        <span
          className={`text-[11px] font-semibold whitespace-nowrap transition-all duration-150 ${
            flagged
              ? "text-[#D63B3B] group-hover:text-[#B5392F] group-hover:underline underline-offset-2"
              : "text-brand group-hover:underline underline-offset-2"
          }`}
        >
          {needsStateReviewAction(item) ? "Review" : "Manage"}
        </span>
      </TableCell>
    </>
  );
}

export function VerificationWorkspace({
  queue: initialQueue,
  breakdown: initialBreakdown,
  initialFlaggedOnly = false,
}: VerificationWorkspaceProps) {
  const searchQuery = useStatePageSearch();
  const [queue, setQueue] = useState(initialQueue);
  const [breakdown, setBreakdown] = useState(initialBreakdown);
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

  useEffect(() => {
    setBreakdown(initialBreakdown);
  }, [initialBreakdown]);

  const refreshBreakdown = useCallback(async () => {
    const { breakdown: next } = await api.state.verification.breakdown();
    setBreakdown(next);
  }, []);

  const hasItems = queue.length > 0;
  const subtitle = hasItems
    ? `285 verified · 98 pending · 56 flagged`
    : "Verification queue populates when academies submit onboarding requests";

  const filtered = useMemo(
    () =>
      queue.filter((item) => {
        if (!matchesVerificationSearch(item, searchQuery)) return false;
        return matchesFilters(item, queueType, statusFilter, districtFilter, timeFilter);
      }),
    [queue, searchQuery, queueType, statusFilter, districtFilter, timeFilter]
  );

  function handleRowClick(item: VerificationQueueItem) {
    if (item.kind === "onboarding") {
      setNurseryId(null);
      setOnboardingId(item.id);
      return;
    }
    if (item.onboardingRequestId) {
      setNurseryId(null);
      setOnboardingId(item.onboardingRequestId);
      return;
    }
    setOnboardingId(null);
    setNurseryId(item.academyId);
  }

  function closeOnboardingModal() {
    setOnboardingId(null);
    setNurseryId(null);
  }

  function closeNurseryModal() {
    setNurseryId(null);
    setOnboardingId(null);
  }

  function handleReviewed(updated: AcademyOnboardingRequestDetail) {
    if (updated.status === "approved") {
      setQueue((current) => current.filter((row) => row.kind !== "onboarding" || row.id !== updated.id));
      void refreshBreakdown();
      return;
    }

    setQueue((current) =>
      current.map((row) =>
        row.kind === "onboarding" && row.id === updated.id
          ? {
              ...row,
              requestType: updated.requestType,
              status: updated.status,
              statusLabel: ONBOARDING_STATUS_LABELS[updated.status],
              statusVariant: onboardingStatusVariant(updated.status),
            }
          : row
      )
    );
    void refreshBreakdown();
  }

  function handleNurseryUpdated(nursery: StateNurseryDetail) {
    setQueue((current) =>
      current.map((row) =>
        row.kind === "nursery" && row.academyId === nursery.academyId
          ? {
              ...row,
              verificationStatus: nursery.verificationStatus,
              statusLabel: nursery.statusLabel,
              statusVariant: nursery.status,
              flagResponseStatus: nursery.flagResponseStatus,
            }
          : row
      )
    );
    void refreshBreakdown();
  }

  function handleNurseryRemoved(academyId: string) {
    setQueue((current) =>
      current.filter((row) => row.kind !== "nursery" || row.academyId !== academyId)
    );
    void refreshBreakdown();
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
            value={hasItems ?  285: breakdown.verified.toLocaleString("en-IN")}
            label="Verified"
            valueColor={hasItems ? "#0E9B72" : undefined}
          />
          <StatCard
            compact
            value={hasItems ? 98 : breakdown.pending.toLocaleString("en-IN")}
            label="Pending review"
            valueColor={hasItems ? "#C77F12" : undefined}
          />
          <StatCard
            compact
            value={hasItems ? 56 : breakdown.flagged.toLocaleString("en-IN")}
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
        <ScrollableListPanel
          header={
            <SectionTitle
              title="Verification queue"
              subtitle="onboarding requests and registered nurseries"
            />
          }
        >
          {!hasItems ? (
            <StateSectionEmpty screen="verification" />
          ) : filtered.length === 0 ? (
            <StateFilteredEmpty
              entity="queue items"
              description="Try changing filters or your search term."
            />
          ) : (
            <>
              <AcademyCardList
                scrollable
                className="flex-1 border-0 shadow-none rounded-none"
              >
                {filtered.map((item) => {
                  const statusVariant = verificationQueueStatusVariant(item);
                  const statusLabel = verificationQueueStatusLabel(item);
                  const flagged = isFlaggedNursery(item);

                  return (
                    <AcademyCardListItem
                      key={rowKey(item)}
                      highlighted={flagged}
                      highlightTone={flagged ? "alert" : "default"}
                      title={flaggedRowTitle(item)}
                      onClick={() => handleRowClick(item)}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <Avatar initials={item.initials} color={item.color} />
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-[13px] text-ink truncate group-hover:text-[#B5392F] transition-colors duration-150">
                            {item.name}
                          </div>
                          <div className="text-[11.5px] text-muted mt-0.5 truncate">
                            {mobileSubtitle(item)}
                          </div>
                          {flagged ? (
                            <div className="text-[10.5px] font-medium text-[#B5392F]/85 mt-1">
                              State flag active — tap to review
                            </div>
                          ) : null}
                          <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            <Pill variant={statusVariant}>{statusLabel}</Pill>
                          </div>
                        </div>
                        <span
                          className={`text-[11px] font-semibold shrink-0 transition-all duration-150 ${
                            flagged
                              ? "text-[#D63B3B] group-hover:underline underline-offset-2"
                              : "text-brand group-hover:underline underline-offset-2"
                          }`}
                        >
                          {needsStateReviewAction(item) ? "Review" : "Manage"}
                        </span>
                      </div>
                    </AcademyCardListItem>
                  );
                })}
              </AcademyCardList>

              <AcademyTable
                scrollable
                className="hidden lg:flex flex-1 border-0 shadow-none rounded-none"
                headers={[...TABLE_HEADERS]}
                columnWidths={TABLE_COLUMN_WIDTHS}
                columnClassNames={[...TABLE_COLUMN_CLASS_NAMES]}
              >
                {filtered.map((item) => {
                  const flagged = isFlaggedNursery(item);

                  return (
                    <TableRow
                      key={rowKey(item)}
                      highlighted={flagged}
                      highlightTone={flagged ? "alert" : "default"}
                      title={flaggedRowTitle(item)}
                      onClick={() => handleRowClick(item)}
                    >
                      <QueueRowContent item={item} />
                    </TableRow>
                  );
                })}
              </AcademyTable>
            </>
          )}
        </ScrollableListPanel>
      </div>

      <AcademyOnboardingRequestDetailModal
        requestId={onboardingId}
        open={onboardingId != null}
        onClose={closeOnboardingModal}
        onReviewed={handleReviewed}
      />

      <VerificationNurseryModal
        academyId={nurseryId}
        open={nurseryId != null}
        onClose={closeNurseryModal}
        onUpdated={handleNurseryUpdated}
        onRemoved={handleNurseryRemoved}
      />
    </div>
  );
}
