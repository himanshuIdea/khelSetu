"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { CompetitionFormat, TournamentScheduleMatch } from "@/lib/tournaments";

const fieldClass =
  "w-full mt-1 px-2.5 py-2 text-[13px] border border-line rounded-[8px] bg-white text-ink outline-none focus:border-brand";

const labelClass = "text-[11px] font-semibold text-muted";

function formatScheduleTime(iso: string | null): string {
  if (!iso) return "Not scheduled";
  const date = new Date(iso);
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isoDatePart(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function isoTimePart(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function combineDateTime(datePart: string, timePart: string): string | null {
  if (!datePart) return null;
  const time = timePart.trim() || "09:00";
  return new Date(`${datePart}T${time}:00`).toISOString();
}

type TournamentScheduleTimelineProps = {
  tournamentId: string;
  matches: TournamentScheduleMatch[];
  format: CompetitionFormat;
  trialSlots?: { id: string; label: string; athlete: string }[];
};

export function TournamentScheduleTimeline({
  tournamentId,
  matches,
  format,
  trialSlots = [],
}: TournamentScheduleTimelineProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const { scheduled, unscheduled } = useMemo(() => {
    const withTime: TournamentScheduleMatch[] = [];
    const withoutTime: TournamentScheduleMatch[] = [];
    for (const match of matches) {
      if (match.scheduledAt) withTime.push(match);
      else withoutTime.push(match);
    }
    return { scheduled: withTime, unscheduled: withoutTime };
  }, [matches]);

  async function patchMatch(
    matchId: string,
    patch: Parameters<typeof api.tournaments.updateMatch>[2]
  ) {
    setSavingId(matchId);
    setError(null);
    try {
      await api.tournaments.updateMatch(tournamentId, matchId, patch);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update schedule.");
    } finally {
      setSavingId(null);
    }
  }

  if (format === "trial") {
    return (
      <div className="space-y-2">
        {trialSlots.length === 0 ? (
          <p className="text-[12px] text-muted">No athletes on merit list yet.</p>
        ) : (
          trialSlots.map((slot, index) => (
            <div key={slot.id} className="border border-line rounded-[8px] p-3">
              <div className="text-[11px] font-bold text-brand">Slot {index + 1}</div>
              <div className="text-[13px] font-medium text-ink mt-1 break-words">{slot.athlete}</div>
              <div className="text-[11px] text-muted mt-0.5 break-words">{slot.label}</div>
            </div>
          ))
        )}
      </div>
    );
  }

  function TimelineRow({ match }: { match: TournamentScheduleMatch }) {
    const isLive = match.status === "live";
    const dateValue = isoDatePart(match.scheduledAt);
    const timeValue = isoTimePart(match.scheduledAt);
    const disabled = savingId === match.id;

    return (
      <div
        className={`rounded-[8px] border p-3 ${
          isLive ? "border-red/40 bg-red/5" : "border-line bg-card"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="text-[12px] font-bold text-brand">{match.matchLabel}</div>
            <div className="text-[11px] text-muted mt-0.5 break-words leading-snug">
              {match.boutSummary}
            </div>
          </div>
          <span
            className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              isLive
                ? "bg-red/10 text-red"
                : match.status === "completed"
                  ? "bg-brand-soft text-brand"
                  : "bg-surface text-muted"
            }`}
          >
            {isLive ? "Live" : match.status === "completed" ? "Done" : "Scheduled"}
          </span>
        </div>

        <div className="mt-3 space-y-2.5">
          <label className="block">
            <span className={labelClass}>Mat</span>
            <input
              className={fieldClass}
              value={match.matLabel ?? ""}
              placeholder="Mat 1"
              disabled={disabled}
              onChange={(event) => {
                void patchMatch(match.id, { matLabel: event.target.value || null });
              }}
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="block min-w-0">
              <span className={labelClass}>Date</span>
              <input
                type="date"
                className={fieldClass}
                value={dateValue}
                disabled={disabled}
                onChange={(event) => {
                  void patchMatch(match.id, {
                    scheduledAt: combineDateTime(event.target.value, timeValue),
                  });
                }}
              />
            </label>
            <label className="block min-w-0">
              <span className={labelClass}>Time</span>
              <input
                type="time"
                className={fieldClass}
                value={timeValue}
                disabled={disabled}
                onChange={(event) => {
                  void patchMatch(match.id, {
                    scheduledAt: combineDateTime(
                      dateValue || new Date().toISOString().slice(0, 10),
                      event.target.value
                    ),
                  });
                }}
              />
            </label>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {match.status !== "live" && match.status !== "completed" ? (
            <button
              type="button"
              disabled={disabled}
              onClick={() => patchMatch(match.id, { status: "live" })}
              className="px-3 py-1.5 rounded-[6px] bg-red text-white text-[11px] font-semibold disabled:opacity-60"
            >
              Go live
            </button>
          ) : null}
          {match.status === "live" ? (
            <button
              type="button"
              disabled={disabled}
              onClick={() => patchMatch(match.id, { status: "completed" })}
              className="px-3 py-1.5 rounded-[6px] border border-line text-[11px] font-semibold disabled:opacity-60"
            >
              Complete
            </button>
          ) : null}
          <span className="text-[10px] text-muted break-words">
            {formatScheduleTime(match.scheduledAt)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p className="text-[12px] text-red break-words" role="alert">
          {error}
        </p>
      ) : null}

      {scheduled.map((match) => (
        <TimelineRow key={match.id} match={match} />
      ))}

      {unscheduled.length > 0 ? (
        <div>
          <div className="text-[11px] font-semibold text-muted mb-2">Unscheduled</div>
          <div className="space-y-2">
            {unscheduled.map((match) => (
              <TimelineRow key={match.id} match={match} />
            ))}
          </div>
        </div>
      ) : null}

      {matches.length === 0 ? (
        <p className="text-[12px] text-muted">No matches generated for this tournament.</p>
      ) : null}
    </div>
  );
}
