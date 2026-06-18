"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { InlineSelect } from "@/components/academy/InlineSelect";
import { FilterPills } from "@/components/academy/shared";
import { PlayerFeedPost } from "@/components/player/PlayerFeedPost";
import { PlayerScrollBody } from "@/components/player/PlayerScrollBody";
import { playerAthleteProfileRoute } from "@/lib/player-nav";
import type {
  AcademyAthlete,
  AcademyFeedItem,
  FeedTopic,
} from "@/lib/repositories/academy-feed";

type PlayerExploreFeedProps = {
  academyId: string;
  items: AcademyFeedItem[];
  sports: { id: string; name: string }[];
  topics: FeedTopic[];
  athletes: AcademyAthlete[];
};

export function PlayerExploreFeed({
  academyId,
  items,
  sports,
  topics,
  athletes,
}: PlayerExploreFeedProps) {
  const [sportId, setSportId] = useState("all");
  const [topic, setTopic] = useState("all");
  const [search, setSearch] = useState("");

  const sportOptions = useMemo(
    () => [
      { value: "all", label: "All sports" },
      ...sports.map((sport) => ({ value: sport.id, label: sport.name })),
    ],
    [sports]
  );

  const topicOptions = useMemo(
    () => [
      { value: "all", label: "All topics" },
      ...topics.map((chip) => ({ value: chip.name, label: chip.name })),
    ],
    [topics]
  );

  const filtered = useMemo(() => {
    let rows = items;
    if (sportId !== "all") {
      rows = rows.filter((item) => item.sportId === sportId);
    }
    if (topic !== "all") {
      const q = topic.toLowerCase();
      rows = rows.filter((item) => item.drillName.toLowerCase().includes(q));
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(
        (item) =>
          item.drillName.toLowerCase().includes(q) ||
          item.authorName.toLowerCase().includes(q) ||
          item.sportName.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [items, search, sportId, topic]);

  return (
    <PlayerScrollBody className="pt-0">
      <div className="mb-3 min-w-0 w-full max-w-full space-y-3">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search drills, athletes, sports…"
          className="w-full min-h-[44px] rounded-[12px] border border-line bg-white px-3 text-[13px] text-ink placeholder:text-muted2"
        />

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
          {topics.length > 0 ? (
            <InlineSelect
              variant="pill"
              filterPill
              aria-label="Filter by drill topic"
              value={topic}
              onChange={setTopic}
              active={topic !== "all"}
              menuMaxHeightClass="max-h-52"
              className="shrink-0 text-[12.5px] font-medium px-[13px] py-2 min-h-[44px]"
              options={topicOptions}
            />
          ) : null}
        </FilterPills>
      </div>

      {athletes.length > 0 ? (
        <section className="mb-5 min-w-0 w-full max-w-full">
          <h2 className="text-[12px] font-bold text-muted uppercase tracking-wide mb-2">
            Shining Stars of the Academy
          </h2>
          <div className="min-w-0 w-full max-w-full overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch] pb-1">
            <div className="flex gap-3 w-max pr-3">
              {athletes.map((athlete) => (
                <div
                  key={athlete.playerId}
                  className="shrink-0 w-[140px] border border-line rounded-[14px] bg-white p-3"
                >
                  <div
                    className="w-10 h-10 rounded-full text-white text-[11px] font-bold flex items-center justify-center mb-2"
                    style={{ background: athlete.avatarColor }}
                  >
                    {athlete.initials}
                  </div>
                  <div className="text-[12.5px] font-semibold text-ink truncate">{athlete.name}</div>
                  <div className="text-[11px] text-muted truncate mb-2">
                    {athlete.sportName} · {athlete.publishedCount} posts
                  </div>
                  <Link
                    href={playerAthleteProfileRoute(athlete.playerId)}
                    className="w-full min-h-[44px] inline-flex items-center justify-center rounded-[10px] text-[12px] font-semibold border border-line text-ink hover:border-brand/30 transition-colors"
                  >
                    View profile
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="min-w-0">
        <h2 className="text-[12px] font-bold text-muted uppercase tracking-wide mb-2">
          Academy media
        </h2>
        {filtered.length === 0 ? (
          <p className="text-[13px] text-muted">Nothing to explore yet.</p>
        ) : (
          filtered.map((item) => (
            <PlayerFeedPost
              key={`${item.type}:${item.sourceId}`}
              academyId={academyId}
              item={item}
            />
          ))
        )}
      </section>
    </PlayerScrollBody>
  );
}
