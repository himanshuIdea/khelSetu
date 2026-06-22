"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { TournamentMedalEditor } from "@/components/academy/tournaments/TournamentMedalEditor";
import { TournamentScheduleTimeline } from "@/components/academy/tournaments/TournamentScheduleTimeline";
import type { CompetitionFormat, TournamentScheduleMatch } from "@/lib/tournaments";

type MedalTally = {
  gold: number;
  silver: number;
  bronze: number;
};

type TournamentOperationsModalProps = {
  open: boolean;
  onClose: () => void;
  tournamentId: string;
  academyName: string;
  format: CompetitionFormat;
  scheduleMatches: TournamentScheduleMatch[];
  medals: MedalTally;
  trialSlots?: { id: string; label: string; athlete: string }[];
};

type TabId = "schedule" | "medals";

export function TournamentOperationsModal({
  open,
  onClose,
  tournamentId,
  academyName,
  format,
  scheduleMatches,
  medals,
  trialSlots = [],
}: TournamentOperationsModalProps) {
  const [tab, setTab] = useState<TabId>("schedule");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const modal = (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="Close operations panel"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tournament-ops-title"
        className="relative w-full sm:max-w-[420px] max-h-[92dvh] sm:max-h-[85vh] bg-card border border-line sm:rounded-(--radius) rounded-t-[16px] shadow-xl flex flex-col overflow-hidden"
      >
        <div className="shrink-0 px-4 py-3 border-b border-line2 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div id="tournament-ops-title" className="text-[15px] font-bold text-ink">
              Schedule & medals
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-[6px] border border-line text-muted text-sm shrink-0"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="shrink-0 px-4 py-2 flex gap-1.5 border-b border-line2">
          <button
            type="button"
            onClick={() => setTab("schedule")}
            className={`flex-1 py-1.5 rounded-[6px] text-[12px] font-semibold ${
              tab === "schedule" ? "bg-brand text-white" : "text-muted hover:bg-surface"
            }`}
          >
            Schedule
          </button>
          <button
            type="button"
            onClick={() => setTab("medals")}
            className={`flex-1 py-1.5 rounded-[6px] text-[12px] font-semibold ${
              tab === "medals" ? "bg-brand text-white" : "text-muted hover:bg-surface"
            }`}
          >
            Medals
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain px-4 py-3 [-webkit-overflow-scrolling:touch]">
          {tab === "schedule" ? (
            <TournamentScheduleTimeline
              tournamentId={tournamentId}
              matches={scheduleMatches}
              format={format}
              trialSlots={trialSlots}
            />
          ) : (
            <TournamentMedalEditor
              tournamentId={tournamentId}
              academyName={academyName}
              initialMedals={medals}
            />
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
