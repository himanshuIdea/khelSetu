"use client";

import { useEffect, useMemo, useState } from "react";
import { InlineSelect } from "@/components/academy/InlineSelect";
import { GridIcon } from "@/components/academy/icons";
import { FilterPills } from "@/components/academy/shared";
import { PlayerEmptyState } from "@/components/player/PlayerEmptyState";
import { PlayerFeedPost } from "@/components/player/PlayerFeedPost";
import { PlayerScrollBody } from "@/components/player/PlayerScrollBody";
import type { AcademyFeedItem } from "@/lib/repositories/academy-feed";

type PlayerFeedProps = {
  academyId: string;
  items: AcademyFeedItem[];
  sports: { id: string; name: string }[];
  highlightPostKey?: string | null;
};

export function PlayerFeed({
  academyId,
  items,
  sports,
  highlightPostKey = null,
}: PlayerFeedProps) {
  const [sportId, setSportId] = useState("all");

  const sportOptions = useMemo(
    () => [
      { value: "all", label: "All sports" },
      ...sports.map((sport) => ({ value: sport.id, label: sport.name })),
    ],
    [sports]
  );

  const filtered = useMemo(() => {
    if (sportId === "all") {
      return items;
    }
    return items.filter((item) => item.sportId === sportId);
  }, [items, sportId]);

  useEffect(() => {
    if (!highlightPostKey) {
      return;
    }
    const element = document.getElementById(
      `feed-${highlightPostKey.replace(":", "--")}`
    );
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightPostKey, filtered]);

  return (
    <PlayerScrollBody className="pt-0">
      <div className="min-w-0 w-full max-w-full">
        <FilterPills>
          <InlineSelect
            variant="pill"
            filterPill
            aria-label="Filter by sport"
            value={sportId}
            onChange={setSportId}
            active={sportId !== "all"}
            menuMaxHeightClass="max-h-52"
            className="shrink-0 text-[12.5px] font-medium px-[13px] py-2 min-h-[44px]"
            options={sportOptions}
          />
        </FilterPills>
      </div>

      {filtered.length === 0 ? (
        <PlayerEmptyState
          icon={<GridIcon className="w-5 h-5" />}
          title="No posts yet"
          description="Your academy feed will show coach-verified training posts here."
        />
      ) : (
        <div className="min-w-0">
          {filtered.map((item) => {
            const key = `${item.type}:${item.sourceId}`;
            return (
              <PlayerFeedPost
                key={key}
                academyId={academyId}
                item={item}
                highlighted={highlightPostKey === key}
              />
            );
          })}
        </div>
      )}
    </PlayerScrollBody>
  );
}
