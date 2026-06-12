"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/academy/shared";
import { PlusIcon } from "@/components/academy/icons";
import { api, ApiError } from "@/lib/api";
import { getInitials } from "@/lib/format";
import type { TeamMemberFormOptions } from "@/lib/teams";

type AddTeamMembersModalProps = {
  academyId: string;
  teamId: string;
  teamName: string;
  open: boolean;
  onClose: () => void;
  formOptions: TeamMemberFormOptions;
};

export function AddTeamMembersModal({
  academyId,
  teamId,
  teamName,
  open,
  onClose,
  formOptions,
}: AddTeamMembersModalProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  function resetForm() {
    setSelectedIds(new Set());
    setError(null);
  }

  function handleClose() {
    if (isSubmitting) return;
    resetForm();
    onClose();
  }

  function togglePlayer(playerId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(playerId)) {
        next.delete(playerId);
      } else {
        next.add(playerId);
      }
      return next;
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isSubmitting || selectedIds.size === 0) return;

    setError(null);
    setIsSubmitting(true);

    try {
      await api.teams.addMembers(academyId, teamId, {
        playerIds: [...selectedIds],
      });

      resetForm();
      onClose();
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
      setIsSubmitting(false);
    }
  }

  if (!open) return null;

  const hasPlayers = formOptions.players.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink/50"
        aria-label="Close add players modal"
        onClick={handleClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-team-members-title"
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-(--radius) shadow-card border border-line"
      >
        <form onSubmit={handleSubmit} className="px-6 py-6">
          <h2 id="add-team-members-title" className="text-xl font-bold text-ink tracking-tight">
            Add players
          </h2>
          <p className="text-[13px] text-muted mt-1.5 mb-5">
            Select academy players to add to {teamName}.
          </p>

          {error && (
            <p className="text-[13px] font-medium text-red mb-4" role="alert">
              {error}
            </p>
          )}

          {!hasPlayers ? (
            <p className="text-[13px] text-muted bg-surface border border-line2 rounded-[10px] px-4 py-3">
              No eligible players available. Add players to your academy first, or all matching
              players may already be on this team.
            </p>
          ) : (
            <div className="border border-line rounded-[10px] divide-y divide-line2 max-h-[min(360px,50vh)] overflow-y-auto">
              {formOptions.players.map((player) => {
                const checked = selectedIds.has(player.id);
                return (
                  <label
                    key={player.id}
                    className={`flex items-center gap-3 px-3.5 py-3 cursor-pointer transition-colors ${
                      checked ? "bg-brand-soft/40" : "hover:bg-surface/80"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePlayer(player.id)}
                      className="w-4 h-4 rounded border-line accent-brand shrink-0"
                    />
                    <Avatar initials={getInitials(player.name)} color={player.avatarColor} />
                    <div className="flex-1 min-w-0 text-left">
                      <div className="font-semibold text-[13px] text-ink truncate">{player.name}</div>
                      <div className="text-[11.5px] text-muted mt-px">
                        {player.batch} · {player.weight}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-5">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center bg-card text-text font-semibold text-[13px] py-[11px] px-4 rounded-[10px] border border-line disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!hasPlayers || selectedIds.size === 0 || isSubmitting}
              className="inline-flex items-center justify-center gap-[7px] bg-brand text-white font-semibold text-[13px] py-[11px] px-4 rounded-[10px] disabled:opacity-50"
            >
              <PlusIcon />
              {isSubmitting
                ? "Adding players…"
                : selectedIds.size > 0
                  ? `Add ${selectedIds.size} player${selectedIds.size === 1 ? "" : "s"}`
                  : "Add players"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
