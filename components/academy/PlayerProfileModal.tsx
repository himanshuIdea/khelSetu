"use client";

import { useEffect } from "react";
import { Avatar, Pill } from "@/components/academy/shared";
import type { PlayerDetail } from "@/lib/repositories/types";

type PlayerProfileModalProps = {
  player: PlayerDetail;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
};

export function PlayerProfileModal({
  player,
  open,
  onClose,
  onEdit,
}: PlayerProfileModalProps) {
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink/50"
        aria-label="Close player profile"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="player-profile-title"
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-(--radius) shadow-card border border-line"
      >
        <div className="px-6 pt-6 pb-4 border-b border-line2">
          <div className="flex flex-col items-center text-center">
            <Avatar
              initials={player.initials}
              color="linear-gradient(135deg, #FF6B2C, #FF9152)"
              size="lg"
            />
            <h2 id="player-profile-title" className="text-xl font-bold text-ink tracking-tight mt-3">
              {player.name}
            </h2>
            <p className="text-[13px] text-muted mt-1">
              {player.id} · {player.sport}
            </p>
            <div className="flex flex-wrap justify-center gap-[7px] mt-3">
              <Pill variant={player.status === "On hold" ? "amber" : "green"}>
                <span
                  className={`w-[7px] h-[7px] rounded-full ${player.status === "On hold" ? "bg-amber" : "bg-green"}`}
                />
                {player.status}
              </Pill>
              <Pill variant="brand">{player.batch}</Pill>
            </div>
          </div>
        </div>

        <div className="flex justify-between px-6 py-4 border-b border-line2">
          {[
            { v: player.rating, l: "Rating" },
            { v: player.attendance, l: "Attendance" },
            { v: player.boutsWon, l: "Bouts won" },
          ].map((stat) => (
            <div key={stat.l} className="text-center">
              <div className="text-[19px] font-bold text-ink">{stat.v}</div>
              <div className="text-[11.5px] text-muted">{stat.l}</div>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 text-[13px] text-text space-y-3">
          <div className="flex justify-between gap-4">
            <span className="text-muted shrink-0">Joined</span>
            <b className="text-right">{player.joined}</b>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-muted shrink-0">Coach</span>
            {player.coachUnassigned ? (
              <Pill variant="grey">Unassigned</Pill>
            ) : (
              <b className="text-right">{player.coach}</b>
            )}
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted shrink-0">Monthly fee</span>
            <b className="text-right">{player.monthlyFee}</b>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-muted shrink-0">Fee status</span>
            <Pill variant={player.feeStatus.startsWith("Paid") ? "green" : "amber"}>
              {player.feeStatus}
            </Pill>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 px-6 pb-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center bg-card text-text font-semibold text-[13px] py-[11px] px-4 rounded-[10px] border border-line"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center justify-center bg-brand text-white font-semibold text-[13px] py-[11px] px-4 rounded-[10px]"
          >
            Edit player
          </button>
        </div>
      </div>
    </div>
  );
}
