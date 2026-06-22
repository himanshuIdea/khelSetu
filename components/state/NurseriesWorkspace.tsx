"use client";

import { useMemo, useState } from "react";
import {
  AcademyTable,
  Avatar,
  FilterPills,
  PageHeader,
  Pill,
  TableCell,
  TableRow,
} from "@/components/academy/shared";
import { StateFilteredEmpty, StateSectionEmpty } from "@/components/state/StateEmptyStates";
import { useStatePageSearch } from "@/components/state/StateSearchContext";
import { InlineSelect } from "@/components/academy/InlineSelect";
import { AddNurseryModal } from "@/components/state/AddNurseryModal";
import { NurseryDetailModal } from "@/components/state/NurseryDetailModal";
import { HARYANA_DISTRICTS, HARYANA_FEATURED_SPORTS } from "@/lib/state-catalog";
import { stateLayout } from "@/lib/state-layout";
import { statePageMeta } from "@/lib/state-nav";
import {
  type NurseryVerificationStatus,
  type StateNurseryListItem,
} from "@/lib/state-nurseries";
import { matchesStateTextSearch } from "@/lib/state-search";

type NurseriesWorkspaceProps = {
  nurseries: StateNurseryListItem[];
};

const meta = statePageMeta.nurseries;

const STATUS_OPTIONS: { value: NurseryVerificationStatus | "all"; label: string }[] = [
  { value: "all", label: "Status: All" },
  { value: "verified", label: "Status: Verified" },
  { value: "pending", label: "Status: Pending" },
  { value: "flagged", label: "Status: Flagged" },
];

const DISTRICT_FILTER_OPTIONS = [
  { value: "all", label: "All districts" },
  ...HARYANA_DISTRICTS.map((district) => ({ value: district, label: district })),
];

const SPORT_FILTER_OPTIONS = [
  { value: "all", label: "Sport: All" },
  ...HARYANA_FEATURED_SPORTS.map((sport) => ({ value: sport, label: `Sport: ${sport}` })),
];

const STATUS_FILTER_OPTIONS = STATUS_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
}));

export function NurseriesWorkspace({ nurseries }: NurseriesWorkspaceProps) {
  const searchQuery = useStatePageSearch();
  const [districtFilter, setDistrictFilter] = useState("all");
  const [sportFilter, setSportFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<NurseryVerificationStatus | "all">("all");
  const [addOpen, setAddOpen] = useState(false);
  const [detailAcademyId, setDetailAcademyId] = useState<string | null>(null);

  const districtCount = useMemo(
    () => new Set(nurseries.map((nursery) => nursery.district)).size,
    [nurseries]
  );

  const filteredNurseries = useMemo(() => {
    return nurseries.filter((nursery) => {
      if (
        !matchesStateTextSearch(searchQuery, [
          nursery.name,
          nursery.district,
          nursery.sportLabel,
          nursery.statusLabel,
          nursery.detail,
        ])
      ) {
        return false;
      }
      if (districtFilter !== "all" && nursery.district !== districtFilter) return false;
      if (sportFilter !== "all" && nursery.sportLabel !== sportFilter) return false;
      if (statusFilter !== "all" && nursery.verificationStatus !== statusFilter) return false;
      return true;
    });
  }, [nurseries, searchQuery, districtFilter, sportFilter, statusFilter]);

  const subtitle = `${nurseries.length} active nurseries across ${districtCount} district${districtCount === 1 ? "" : "s"}`;

  return (
    <div className={stateLayout.listWorkspace}>
      <div className={stateLayout.listChrome}>
        <PageHeader
          title={meta.title}
          subtitle={subtitle}
          actionLabel={meta.actionLabel!}
          onActionClick={() => setAddOpen(true)}
        />

        <FilterPills>
          <InlineSelect
            variant="pill"
            filterPill
            aria-label="Filter by district"
            value={districtFilter}
            onChange={setDistrictFilter}
            active={districtFilter !== "all"}
            menuMaxHeightClass="max-h-52"
            className="shrink-0 text-[12.5px] font-medium px-[13px] py-2"
            options={DISTRICT_FILTER_OPTIONS}
          />

          <InlineSelect
            variant="pill"
            filterPill
            aria-label="Filter by sport"
            value={sportFilter}
            onChange={setSportFilter}
            active={sportFilter !== "all"}
            menuMaxHeightClass="max-h-52"
            className="shrink-0 text-[12.5px] font-medium px-[13px] py-2"
            options={SPORT_FILTER_OPTIONS}
          />

          <InlineSelect
            variant="pill"
            filterPill
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(value) =>
              setStatusFilter(value as NurseryVerificationStatus | "all")
            }
            active={statusFilter !== "all"}
            className="shrink-0 text-[12.5px] font-medium px-[13px] py-2"
            options={STATUS_FILTER_OPTIONS}
          />
        </FilterPills>
      </div>

      <div className={stateLayout.listScrollRegion}>
        {nurseries.length === 0 ? (
          <div className="bg-card border border-line rounded-(--radius) overflow-hidden min-w-0">
            <StateSectionEmpty
              screen="nurseries"
              description="Approved academy onboarding requests and manually registered nurseries appear here."
            />
            <div className="px-4 pb-6 flex justify-center">
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="inline-flex items-center justify-center gap-[7px] bg-brand text-white font-semibold text-[13px] py-[11px] px-4 rounded-[10px]"
              >
                {meta.actionLabel}
              </button>
            </div>
          </div>
        ) : filteredNurseries.length === 0 ? (
          <div className="bg-card border border-line rounded-(--radius) overflow-hidden min-w-0">
            <StateFilteredEmpty entity="nurseries" description="Try changing filters or your search term." />
          </div>
        ) : (
          <AcademyTable
            scrollable
            headers={["Nursery", "District · Sport", "Athletes", "Status", ""]}
            minWidth={640}
          >
            {filteredNurseries.map((nursery) => (
              <TableRow
                key={nursery.academyId}
                onClick={() => setDetailAcademyId(nursery.academyId)}
              >
                <TableCell>
                  <div className="flex items-center gap-[11px]">
                    <Avatar initials={nursery.initials} color={nursery.color} />
                    <div>
                      <div className="font-semibold text-[13px] text-ink">{nursery.name}</div>
                      <div className="text-[11.5px] text-muted">{nursery.detail}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{nursery.detail}</TableCell>
                <TableCell>
                  <b>{nursery.athleteCount}</b>
                </TableCell>
                <TableCell>
                  <Pill variant={nursery.status}>{nursery.statusLabel}</Pill>
                </TableCell>
                <TableCell>
                  <span className="text-[11px] font-semibold text-brand">View</span>
                </TableCell>
              </TableRow>
            ))}
          </AcademyTable>
        )}
      </div>

      <AddNurseryModal open={addOpen} onClose={() => setAddOpen(false)} />
      <NurseryDetailModal
        academyId={detailAcademyId}
        open={detailAcademyId != null}
        onClose={() => setDetailAcademyId(null)}
      />
    </div>
  );
}
