"use client";

import { useMemo } from "react";
import {
  AcademyTable,
  PageHeader,
  TableCell,
  TableRow,
} from "@/components/academy/shared";
import { StateFilteredEmpty, StateListEmpty } from "@/components/state/StateEmptyStates";
import { useStatePageSearch } from "@/components/state/StateSearchContext";
import { HARYANA_DISTRICTS } from "@/lib/state-catalog";
import { stateLayout } from "@/lib/state-layout";
import { statePageMeta } from "@/lib/state-nav";
import type { StateDistrictRow } from "@/lib/state-portal";
import { matchesStateTextSearch } from "@/lib/state-search";

type DistrictsWorkspaceProps = {
  districts: StateDistrictRow[];
  hasDistricts: boolean;
};

const meta = statePageMeta.districts;

function verificationRateClass(rate: number | null): string {
  if (rate === null) return "text-muted";
  if (rate >= 80) return "text-[#0E9B72]";
  if (rate > 0) return "text-[#C77F12]";
  return "text-[#D63B3B]";
}

export function DistrictsWorkspace({ districts, hasDistricts }: DistrictsWorkspaceProps) {
  const searchQuery = useStatePageSearch();

  const filteredDistricts = useMemo(
    () =>
      districts.filter((district) => matchesStateTextSearch(searchQuery, [district.name])),
    [districts, searchQuery]
  );

  return (
    <div className={stateLayout.listWorkspace}>
      <div className={stateLayout.listChrome}>
        <PageHeader
          title={meta.title}
          subtitle={
            hasDistricts
              ? `Performance and coverage across all ${HARYANA_DISTRICTS.length} districts`
              : "District performance and coverage metrics appear after statewide registration"
          }
          actionLabel={hasDistricts ? meta.actionLabel : undefined}
        />
      </div>

      <div className={stateLayout.listScrollRegion}>
        {!hasDistricts ? (
          <StateListEmpty screen="districts" />
        ) : filteredDistricts.length === 0 ? (
          <StateFilteredEmpty
            entity="districts"
            description="Try changing your search term."
          />
        ) : (
          <AcademyTable
            scrollable
            headers={["District", "Nurseries", "Athletes", "Verification", "Coaches"]}
            minWidth={560}
          >
            {filteredDistricts.map((d) => (
              <TableRow key={d.name}>
                <TableCell>
                  <b className="text-ink">{d.name}</b>
                </TableCell>
                <TableCell>{d.nurseries}</TableCell>
                <TableCell>{d.athletes}</TableCell>
                <TableCell>
                  <b className={verificationRateClass(d.verificationRate)}>{d.verified}</b>
                </TableCell>
                <TableCell>{d.coaches}</TableCell>
              </TableRow>
            ))}
          </AcademyTable>
        )}
      </div>
    </div>
  );
}
