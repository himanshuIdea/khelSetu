"use client";

import { useMemo, useState } from "react";
import { DotsIcon } from "@/components/academy/icons";
import {
  AcademyTable,
  Avatar,
  FilterPills,
  PageHeader,
  TableCell,
  TableRow,
} from "@/components/academy/shared";
import { StateFilteredEmpty, StateListEmpty } from "@/components/state/StateEmptyStates";
import { InlineSelect } from "@/components/academy/InlineSelect";
import {
  parseAthleteRating,
  RatingFilterSlider,
} from "@/components/state/RatingFilterSlider";
import { HARYANA_DISTRICTS, HARYANA_FEATURED_SPORTS } from "@/lib/state-catalog";
import { stateLayout } from "@/lib/state-layout";
import { statePageMeta } from "@/lib/state-nav";
import type { StateAthleteListItem } from "@/lib/state-portal";
import { formatSportWeightLine } from "@/lib/format";

type AthletesWorkspaceProps = {
  athletes: StateAthleteListItem[];
};

const meta = statePageMeta.athletes;

const DISTRICT_OPTIONS = [
  { value: "all", label: "District: All" },
  ...HARYANA_DISTRICTS.map((d) => ({ value: d, label: d })),
];

const SPORT_OPTIONS = [
  { value: "all", label: "All sports" },
  ...HARYANA_FEATURED_SPORTS.map((s) => ({ value: s, label: s })),
];

const DEFAULT_MIN_RATING = 7;

export function AthletesWorkspace({ athletes }: AthletesWorkspaceProps) {
  const [districtFilter, setDistrictFilter] = useState("all");
  const [sportFilter, setSportFilter] = useState("all");
  const [minRating, setMinRating] = useState(DEFAULT_MIN_RATING);

  const filtered = useMemo(() => {
    return athletes.filter((a) => {
      if (districtFilter !== "all" && a.district !== districtFilter) return false;
      if (sportFilter !== "all" && !a.sport.startsWith(sportFilter)) return false;
      const rating = parseAthleteRating(a.rating);
      if (rating != null && rating < minRating) return false;
      return true;
    });
  }, [athletes, districtFilter, sportFilter, minRating]);

  const subtitle =
    athletes.length > 0
      ? `${athletes.length.toLocaleString("en-IN")} athletes tracked statewide`
      : "Registered athletes from verified nurseries will appear here";

  if (athletes.length === 0) {
    return (
      <div className={stateLayout.listWorkspace}>
        <div className={stateLayout.listChrome}>
          <PageHeader title={meta.title} subtitle={subtitle} />
        </div>
        <StateListEmpty screen="athletes" />
      </div>
    );
  }

  return (
    <div className={stateLayout.listWorkspace}>
      <div className={stateLayout.listChrome}>
        <PageHeader
          title={meta.title}
          subtitle={subtitle}
          actionLabel={meta.actionLabel}
        />

        <div className="flex flex-wrap gap-2 mb-3.5 min-w-0">
          <FilterPills>
            <InlineSelect
              value={sportFilter}
              options={SPORT_OPTIONS}
              onChange={setSportFilter}
              variant="pill"
              className="shrink-0"
            />
            <InlineSelect
              value={districtFilter}
              options={DISTRICT_OPTIONS}
              onChange={setDistrictFilter}
              variant="pill"
              className="shrink-0"
            />
            <RatingFilterSlider value={minRating} onChange={setMinRating} />
          </FilterPills>
        </div>
      </div>

      <div className={stateLayout.listScrollRegion}>
        {filtered.length === 0 ? (
          <StateFilteredEmpty
            entity="athletes"
            description="Try lowering the rating threshold or changing district or sport filters."
          />
        ) : (
          <AcademyTable
            scrollable
            headers={["Athlete", "Sport · Batch", "District", "KhelSetu score", ""]}
            minWidth={640}
          >
            {filtered.map((a) => (
              <TableRow key={a.id}>
                <TableCell>
                  <div className="flex items-center gap-[11px]">
                    <Avatar initials={a.initials} color={a.color} />
                    <div>
                      <div className="font-semibold text-[13px] text-ink">{a.name}</div>
                      <div className="text-[11.5px] text-muted">{a.detail}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{formatSportWeightLine(a.sport)}</TableCell>
                <TableCell>{a.district}</TableCell>
                <TableCell>
                  <b className="text-[#0E9B72]">{a.rating}</b>
                </TableCell>
                <TableCell>
                  <DotsIcon className="text-muted2" />
                </TableCell>
              </TableRow>
            ))}
          </AcademyTable>
        )}
      </div>
    </div>
  );
}
