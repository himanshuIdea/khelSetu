"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { PlusIcon } from "@/components/academy/icons";
import {
  TournamentParticipantPickerList,
  type TournamentParticipantEmptyContext,
} from "@/components/academy/TournamentParticipantPickerList";
import { api, ApiError } from "@/lib/api";
import type {
  AgeDivision,
  EligibleTournamentPlayer,
  InterAcademyOption,
} from "@/lib/tournaments";
import { matchesStateTextSearch } from "@/lib/state-search";

type TournamentInterParticipantModalProps = {
  academyId: string;
  open: boolean;
  onClose: () => void;
  onConfirm: (players: EligibleTournamentPlayer[]) => void;
  sportId: string;
  sportName: string;
  ageDivision: AgeDivision;
  divisionLabel: string;
  weightClass?: string;
  requiresWeight: boolean;
  initialSelectedIds?: string[];
};

export function TournamentInterParticipantModal({
  academyId,
  open,
  onClose,
  onConfirm,
  sportId,
  sportName,
  ageDivision,
  divisionLabel,
  weightClass,
  requiresWeight,
  initialSelectedIds = [],
}: TournamentInterParticipantModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [academies, setAcademies] = useState<InterAcademyOption[]>([]);
  const [selectedAcademyIds, setSelectedAcademyIds] = useState<Set<string>>(new Set([academyId]));
  const [players, setPlayers] = useState<EligibleTournamentPlayer[]>([]);
  const [weightClasses, setWeightClasses] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialSelectedIds));
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setSelectedAcademyIds(new Set([academyId]));
    setSelectedIds(new Set(initialSelectedIds));
    setSearch("");
    setError(null);
    setPlayers([]);
    setWeightClasses([]);

    api.tournaments
      .interAcademies(academyId)
      .then((res) => setAcademies(res.academies))
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Could not load academies.");
      });
  }, [academyId, initialSelectedIds, open]);

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

  async function loadPlayers() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.tournaments.eligiblePlayers(academyId, {
        sportId,
        ageDivision,
        weightClass,
        scope: "inter_academy",
        academyIds: [...selectedAcademyIds],
      });
      setPlayers(res.players);
      setWeightClasses(res.weightClasses);
      setStep(2);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load players.");
    } finally {
      setIsLoading(false);
    }
  }

  const filteredAcademies = useMemo(() => {
    if (!search.trim() || step !== 1) return academies;
    return academies.filter((academy) =>
      matchesStateTextSearch(search, [academy.name, academy.district])
    );
  }, [academies, search, step]);

  const filteredPlayers = useMemo(() => {
    if (!search.trim() || step !== 2) return players;
    return players.filter((player) =>
      matchesStateTextSearch(search, [
        player.name,
        player.academyName,
        player.batch,
        player.rating,
      ])
    );
  }, [players, search, step]);

  const emptyContext: TournamentParticipantEmptyContext = {
    sportName,
    divisionLabel,
    weightClass,
    weightClasses,
    requiresWeight,
  };

  function toggleAcademy(id: string) {
    if (id === academyId) return;
    setSelectedAcademyIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function togglePlayer(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const selected = players.filter((player) => selectedIds.has(player.id));
    onConfirm(selected);
    onClose();
  }

  if (!open) return null;

  const modal = (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink/50"
        aria-label="Close participant picker"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-(--radius) shadow-card border border-line"
      >
        <form onSubmit={handleSubmit} className="px-6 py-6">
          <h2 className="text-xl font-bold text-ink tracking-tight">
            {step === 1 ? "Select academies" : "Select athletes"}
          </h2>
          <p className="text-[13px] text-muted mt-1.5 mb-4">
            {step === 1
              ? "Choose partner academies, then pick athletes from the combined pool."
              : "Inter-academy athletes matching your filters."}
          </p>

          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={step === 1 ? "Search academies…" : "Search athletes…"}
            className="w-full mb-4 px-3 py-2.5 text-[13px] border border-line rounded-[10px] outline-none focus:border-brand"
          />

          {error ? (
            <p className="text-[13px] text-red mb-3" role="alert">
              {error}
            </p>
          ) : null}

          {step === 1 ? (
            <div className="border border-line rounded-[10px] divide-y divide-line2 max-h-[min(360px,50vh)] overflow-y-auto">
              <div className="px-3.5 py-3 bg-brand-soft/20 text-[12px] font-medium text-ink">
                Your academy (always included)
              </div>
              {filteredAcademies.map((academy) => {
                const checked = selectedAcademyIds.has(academy.academyId);
                return (
                  <label
                    key={academy.academyId}
                    className={`flex items-center gap-3 px-3.5 py-3 cursor-pointer ${
                      checked ? "bg-brand-soft/40" : "hover:bg-surface/80"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleAcademy(academy.academyId)}
                      className="w-4 h-4 rounded border-line accent-brand shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[13px] text-ink truncate">{academy.name}</div>
                      <div className="text-[11.5px] text-muted">{academy.district}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          ) : (
            <TournamentParticipantPickerList
              players={filteredPlayers}
              selectedIds={selectedIds}
              onToggle={togglePlayer}
              isLoading={isLoading}
              filtersReady
              emptyContext={emptyContext}
              showAcademy
            />
          )}

          <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-5">
            <div>
              {step === 2 ? (
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setSearch("");
                  }}
                  className="text-[13px] font-semibold text-brand"
                >
                  ← Back to academies
                </button>
              ) : null}
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center bg-card text-text font-semibold text-[13px] py-[11px] px-4 rounded-[10px] border border-line"
              >
                Cancel
              </button>
              {step === 1 ? (
                <button
                  type="button"
                  disabled={isLoading || selectedAcademyIds.size === 0}
                  onClick={loadPlayers}
                  className="inline-flex items-center justify-center gap-[7px] bg-brand text-white font-semibold text-[13px] py-[11px] px-4 rounded-[10px] disabled:opacity-50"
                >
                  Continue to athletes
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={selectedIds.size < 2}
                  className="inline-flex items-center justify-center gap-[7px] bg-brand text-white font-semibold text-[13px] py-[11px] px-4 rounded-[10px] disabled:opacity-50"
                >
                  <PlusIcon />
                  Confirm {selectedIds.size} athletes
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
