"use client";

import { FormEvent, useEffect, useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { InlineDatePicker } from "@/components/academy/InlineDatePicker";
import {
  InlineDropdown,
  InlineFieldGroup,
  InlineInput,
  type DropdownOption,
} from "@/components/academy/InlineFormFields";
import { TournamentInterParticipantModal } from "@/components/academy/TournamentInterParticipantModal";
import {
  SelectedParticipantChips,
  TournamentParticipantPickerList,
} from "@/components/academy/TournamentParticipantPickerList";
import { PlusIcon } from "@/components/academy/icons";
import { AuthField } from "@/components/auth/AuthField";
import { api, ApiError } from "@/lib/api";
import {
  AGE_DIVISION_OPTIONS,
  COMPETITION_FORMAT_OPTIONS,
  PARTICIPATION_SCOPE_OPTIONS,
  sportRequiresWeightClass,
  type AgeDivision,
  type CompetitionFormat,
  type EligibleTournamentPlayer,
  type ParticipationScope,
} from "@/lib/tournaments";

type SportOption = { id: string; name: string };

type CreateTournamentModalProps = {
  academyId: string;
  open: boolean;
  onClose: () => void;
  sports: SportOption[];
};

function todayIso() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function CreateTournamentModal({
  academyId,
  open,
  onClose,
  sports,
}: CreateTournamentModalProps) {
  const router = useRouter();
  const fieldIds = useId();
  const id = (name: string) => `${fieldIds}-${name}`;

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState(todayIso());
  const [endDate, setEndDate] = useState(todayIso());
  const [participationScope, setParticipationScope] = useState<ParticipationScope>("intra_academy");
  const [competitionFormat, setCompetitionFormat] = useState<CompetitionFormat>("knockout");
  const [ageDivision, setAgeDivision] = useState<AgeDivision>("senior");
  const [sportId, setSportId] = useState("");
  const [weightClass, setWeightClass] = useState("");
  const [weightClasses, setWeightClasses] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [eligiblePlayers, setEligiblePlayers] = useState<EligibleTournamentPlayer[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedSport = sports.find((sport) => sport.id === sportId);
  const requiresWeight = selectedSport ? sportRequiresWeightClass(selectedSport.name) : false;
  const divisionLabel =
    AGE_DIVISION_OPTIONS.find((option) => option.value === ageDivision)?.label ?? ageDivision;

  const sportOptions = useMemo<DropdownOption[]>(
    () => sports.map((sport) => ({ value: sport.id, label: sport.name })),
    [sports]
  );

  const filtersReady = Boolean(
    sportId && ageDivision && (!requiresWeight || weightClass.trim())
  );

  const participants = useMemo(
    () => eligiblePlayers.filter((player) => selectedIds.has(player.id)),
    [eligiblePlayers, selectedIds]
  );

  const academyCount = useMemo(
    () => new Set(participants.map((player) => player.academyId)).size,
    [participants]
  );

  const participantsFiltersHint = requiresWeight
    ? "Enter sport, age division, and weight class (kg) to load athletes."
    : "Choose sport and age division to load athletes.";

  useEffect(() => {
    if (!open) return;
    if (sports.length > 0 && !sportId) setSportId(sports[0].id);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !pickerOpen) onClose();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, pickerOpen, sportId, sports]);

  useEffect(() => {
    if (!open || participationScope !== "intra_academy" || !filtersReady) {
      setEligiblePlayers([]);
      setWeightClasses([]);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setIsLoadingPlayers(true);
      setLoadError(null);

      api.tournaments
        .eligiblePlayers(academyId, {
          sportId,
          ageDivision,
          weightClass: requiresWeight ? weightClass.trim() : undefined,
          scope: "intra_academy",
        })
        .then((res) => {
          if (cancelled) return;
          setEligiblePlayers(res.players);
          setWeightClasses(res.weightClasses);
          setSelectedIds((prev) => {
            const valid = new Set(res.players.map((player) => player.id));
            return new Set([...prev].filter((playerId) => valid.has(playerId)));
          });
        })
        .catch((err) => {
          if (cancelled) return;
          setEligiblePlayers([]);
          setWeightClasses([]);
          setLoadError(err instanceof ApiError ? err.message : "Could not load players.");
        })
        .finally(() => {
          if (!cancelled) setIsLoadingPlayers(false);
        });
    }, requiresWeight ? 350 : 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    academyId,
    ageDivision,
    filtersReady,
    open,
    participationScope,
    requiresWeight,
    sportId,
    weightClass,
  ]);

  function resetForm() {
    setName("");
    setLocation("");
    setStartDate(todayIso());
    setEndDate(todayIso());
    setParticipationScope("intra_academy");
    setCompetitionFormat("knockout");
    setAgeDivision("senior");
    setSportId(sports[0]?.id ?? "");
    setWeightClass("");
    setWeightClasses([]);
    setDescription("");
    setEligiblePlayers([]);
    setSelectedIds(new Set());
    setLoadError(null);
    setError(null);
  }

  function handleClose() {
    if (isSubmitting) return;
    resetForm();
    onClose();
  }

  function clearParticipants() {
    setSelectedIds(new Set());
  }

  function toggleParticipant(playerId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(playerId)) next.delete(playerId);
      else next.add(playerId);
      return next;
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isSubmitting || participants.length < 2) return;

    setError(null);
    setIsSubmitting(true);

    try {
      await api.tournaments.create(academyId, {
        name: name.trim(),
        location: location.trim(),
        startDate,
        endDate,
        participationScope,
        competitionFormat,
        ageDivision,
        sportId,
        weightClass: weightClass.trim() || null,
        description: description.trim() || null,
        participantIds: participants.map((player) => ({
          playerId: player.id,
          academyId: player.academyId,
        })),
      });
      resetForm();
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create tournament.");
      setIsSubmitting(false);
    }
  }

  if (!open) return null;

  const canSubmit =
    name.trim() !== "" &&
    location.trim() !== "" &&
    startDate &&
    endDate &&
    participants.length >= 2 &&
    filtersReady;

  const participantSummary =
    participants.length === 0
      ? "Select at least 2 athletes"
      : `${participants.length} athletes from ${academyCount} ${academyCount === 1 ? "academy" : "academies"}`;

  const emptyContext = {
    sportName: selectedSport?.name ?? "sport",
    divisionLabel,
    weightClass: requiresWeight ? weightClass.trim() : undefined,
    weightClasses,
    requiresWeight,
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <button
          type="button"
          className="absolute inset-0 bg-ink/50"
          aria-label="Close create tournament modal"
          onClick={handleClose}
        />

        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-tournament-title"
          className="relative flex flex-col w-full max-w-lg max-h-[min(90vh,720px)] bg-white rounded-(--radius) shadow-card border border-line"
        >
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
            <div className="px-6 pt-6 shrink-0">
              <h2 id="create-tournament-title" className="text-xl font-bold text-ink tracking-tight">
                Create tournament
              </h2>
              <p className="text-[13px] text-muted mt-1.5 mb-5">
                Set up an inter- or intra-academy event with brackets, pools, or merit lists.
              </p>

              {error ? (
                <p className="text-[13px] font-medium text-red mb-4" role="alert">
                  {error}
                </p>
              ) : null}

              <AuthField
                label="Tournament name"
                placeholder="e.g. Haryana Inter-Academy Wrestling Championship 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <AuthField
                label="Venue"
                placeholder="e.g. Sonipat"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>

            <div className="px-6 flex-1 min-h-0 overflow-y-auto">
              <InlineFieldGroup className="mb-4">
                <InlineDatePicker
                  label="Start date"
                  id={id("start-date")}
                  value={startDate}
                  onChange={setStartDate}
                  panelZIndexClass="z-[70]"
                />
                <InlineDatePicker
                  label="End date"
                  id={id("end-date")}
                  value={endDate}
                  onChange={setEndDate}
                  panelZIndexClass="z-[70]"
                />
                <InlineDropdown
                  label="Scope"
                  id={id("scope")}
                  value={participationScope}
                  onChange={(value) => {
                    setParticipationScope(value as ParticipationScope);
                    clearParticipants();
                  }}
                  options={PARTICIPATION_SCOPE_OPTIONS}
                  placeholder="Select scope"
                  menuZIndexClass="z-[60]"
                />
                <InlineDropdown
                  label="Format"
                  id={id("format")}
                  value={competitionFormat}
                  onChange={(value) => setCompetitionFormat(value as CompetitionFormat)}
                  options={COMPETITION_FORMAT_OPTIONS}
                  placeholder="Select format"
                  menuZIndexClass="z-[60]"
                />
                <InlineDropdown
                  label="Division"
                  id={id("division")}
                  value={ageDivision}
                  onChange={(value) => {
                    setAgeDivision(value as AgeDivision);
                    setWeightClass("");
                    clearParticipants();
                  }}
                  options={AGE_DIVISION_OPTIONS}
                  placeholder="Select division"
                  menuZIndexClass="z-[60]"
                />
                <InlineDropdown
                  label="Sport"
                  id={id("sport")}
                  value={sportId}
                  onChange={(value) => {
                    setSportId(value);
                    setWeightClass("");
                    clearParticipants();
                  }}
                  options={sportOptions}
                  placeholder="Select sport"
                  menuZIndexClass="z-[60]"
                />
                {requiresWeight ? (
                  <InlineInput
                    label="Weight"
                    id={id("weight")}
                    value={weightClass}
                    onChange={(e) => {
                      setWeightClass(e.target.value);
                      clearParticipants();
                    }}
                    placeholder="e.g. 65"
                    suffix="kg"
                    inputMode="decimal"
                  />
                ) : null}
              </InlineFieldGroup>

              <div className="mb-4">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div>
                    <div className="text-[12px] font-semibold text-muted">Participants</div>
                    <div className="text-[13px] font-medium text-ink mt-0.5">{participantSummary}</div>
                  </div>
                  {participationScope === "inter_academy" ? (
                    <button
                      type="button"
                      disabled={!filtersReady}
                      onClick={() => setPickerOpen(true)}
                      className="text-brand text-[12px] font-semibold shrink-0 disabled:opacity-50"
                    >
                      Choose athletes
                    </button>
                  ) : null}
                </div>

                {loadError ? (
                  <p className="text-[13px] text-red mb-2" role="alert">
                    {loadError}
                  </p>
                ) : null}

                {participationScope === "intra_academy" ? (
                  <>
                    <SelectedParticipantChips participants={participants} />
                    <TournamentParticipantPickerList
                      players={eligiblePlayers}
                      selectedIds={selectedIds}
                      onToggle={toggleParticipant}
                      isLoading={isLoadingPlayers}
                      filtersReady={filtersReady}
                      emptyContext={emptyContext}
                      filtersHint={participantsFiltersHint}
                    />
                  </>
                ) : (
                  <>
                    <SelectedParticipantChips participants={participants} />
                    {!filtersReady ? (
                      <p className="text-[13px] text-muted bg-surface border border-line2 rounded-[10px] px-4 py-3">
                        {participantsFiltersHint} Then use{" "}
                        <span className="font-semibold text-ink">Choose athletes</span> to pick from
                        partner academies.
                      </p>
                    ) : participants.length === 0 ? (
                      <p className="text-[13px] text-muted bg-surface border border-line2 rounded-[10px] px-4 py-3">
                        Tap <span className="font-semibold text-ink">Choose athletes</span> to pick
                        from partner academies.
                      </p>
                    ) : null}
                  </>
                )}
              </div>

              <AuthField
                label="Description"
                placeholder="Optional notes for officials and coaches"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="px-6 pb-6 pt-2 shrink-0 border-t border-line2 bg-white">
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="inline-flex items-center justify-center bg-card text-text font-semibold text-[13px] py-[11px] px-4 rounded-[10px] border border-line"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit || isSubmitting}
                  className="inline-flex items-center justify-center gap-[7px] bg-brand text-white font-semibold text-[13px] py-[11px] px-4 rounded-[10px] disabled:opacity-50"
                >
                  <PlusIcon />
                  {isSubmitting ? "Creating…" : "Create tournament"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {participationScope === "inter_academy" ? (
        <TournamentInterParticipantModal
          academyId={academyId}
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onConfirm={(players) => {
            setSelectedIds(new Set(players.map((player) => player.id)));
            setEligiblePlayers(players);
          }}
          sportId={sportId}
          sportName={selectedSport?.name ?? "sport"}
          ageDivision={ageDivision}
          divisionLabel={divisionLabel}
          weightClass={weightClass.trim() || undefined}
          requiresWeight={requiresWeight}
          initialSelectedIds={[...selectedIds]}
        />
      ) : null}
    </>
  );
}
