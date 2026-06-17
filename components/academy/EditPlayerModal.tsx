"use client";

import { FormEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { InlineDatePicker } from "@/components/academy/InlineDatePicker";
import {
  InlineDropdown,
  InlineFieldGroup,
  InlineInput,
  type DropdownOption,
} from "@/components/academy/InlineFormFields";
import { AuthField } from "@/components/auth/AuthField";
import { api, ApiError } from "@/lib/api";
import { dedupeFormBatches, getBatchLabel } from "@/lib/batches";
import {
  getCoachesForBatch,
  getPrimaryCoachIdForBatch,
  type PlayerFormOptions,
} from "@/lib/players";

type EditPlayerModalProps = {
  academyId: string;
  externalId: string | null;
  open: boolean;
  onClose: () => void;
  formOptions: PlayerFormOptions;
};

const STATUS_OPTIONS: DropdownOption[] = [
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On hold" },
];

export function EditPlayerModal({
  academyId,
  externalId,
  open,
  onClose,
  formOptions,
}: EditPlayerModalProps) {
  const router = useRouter();
  const fieldIds = useId();
  const id = (name: string) => `${fieldIds}-${name}`;
  const prevSportIdRef = useRef<string | null>(null);
  const prevBatchIdRef = useRef<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [sportId, setSportId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [weightCategory, setWeightCategory] = useState("");
  const [heightCategory, setHeightCategory] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [monthlyFee, setMonthlyFee] = useState("");
  const [primaryCoachId, setPrimaryCoachId] = useState("");
  const [status, setStatus] = useState<"active" | "on_hold">("active");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sportOptions = useMemo<DropdownOption[]>(
    () =>
      formOptions.sports.map((sport) => ({
        value: sport.id,
        label: sport.name,
      })),
    [formOptions.sports]
  );

  const batchesForSport = useMemo(
    () =>
      dedupeFormBatches(formOptions.batches.filter((batch) => batch.sportId === sportId)),
    [formOptions.batches, sportId]
  );

  const coachesForBatch = useMemo(
    () => getCoachesForBatch(formOptions, batchId),
    [formOptions, batchId]
  );

  const batchOptions = useMemo<DropdownOption[]>(
    () =>
      batchesForSport.map((batch) => ({
        value: batch.id,
        label: getBatchLabel(batch.name),
      })),
    [batchesForSport]
  );

  const coachOptions = useMemo<DropdownOption[]>(
    () =>
      coachesForBatch.map((coach) => ({
        value: coach.coachId,
        label: coach.isPrimary ? `${coach.coachName} · Primary` : coach.coachName,
      })),
    [coachesForBatch]
  );

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) onClose();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, isSubmitting]);

  useEffect(() => {
    if (!open || !externalId) return;

    let cancelled = false;
    prevSportIdRef.current = null;
    prevBatchIdRef.current = null;
    setIsLoading(true);
    setError(null);

    api.players
      .getForEdit(academyId, externalId)
      .then((player) => {
        if (cancelled) return;

        setFullName(player.fullName);
        setSportId(player.sportId);
        setBatchId(player.batchId);
        setWeightCategory(player.weightCategory ?? "");
        setHeightCategory(player.heightCategory ?? "");
        setDateOfBirth(player.dateOfBirth ?? "");
        setMonthlyFee(
          player.monthlyFeePaise != null ? String(player.monthlyFeePaise / 100) : ""
        );
        const loadedCoachId = player.primaryCoachId ?? "";
        const batchCoaches = getCoachesForBatch(formOptions, player.batchId);
        const coachIsValid = batchCoaches.some((coach) => coach.coachId === loadedCoachId);
        setPrimaryCoachId(coachIsValid ? loadedCoachId : "");
        setStatus(player.status ?? "active");
        prevSportIdRef.current = player.sportId;
        prevBatchIdRef.current = player.batchId;
        setIsLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;

        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Could not load player details.");
        }
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, externalId, academyId, formOptions]);

  useEffect(() => {
    if (!open) {
      prevSportIdRef.current = null;
      prevBatchIdRef.current = null;
      return;
    }

    if (prevSportIdRef.current && prevSportIdRef.current !== sportId) {
      setBatchId("");
      setPrimaryCoachId("");
      prevBatchIdRef.current = null;
    }

    if (sportId) {
      prevSportIdRef.current = sportId;
    }
  }, [sportId, open]);

  useEffect(() => {
    if (!open || isLoading) return;

    const prevBatchId = prevBatchIdRef.current;
    if (prevBatchId && prevBatchId !== batchId) {
      setPrimaryCoachId(batchId ? getPrimaryCoachIdForBatch(formOptions, batchId) : "");
    }

    if (batchId) {
      prevBatchIdRef.current = batchId;
    } else if (!batchId) {
      prevBatchIdRef.current = null;
    }
  }, [batchId, open, isLoading, formOptions]);

  function handleClose() {
    if (isSubmitting) return;
    onClose();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isSubmitting || !externalId) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const monthlyFeePaise =
        monthlyFee.trim() === "" ? undefined : Math.round(Number(monthlyFee) * 100);

      await api.players.update(academyId, externalId, {
        fullName: fullName.trim(),
        sportId,
        batchId,
        weightCategory: weightCategory.trim() || undefined,
        heightCategory: heightCategory.trim() || undefined,
        dateOfBirth: dateOfBirth || undefined,
        monthlyFeePaise,
        primaryCoachId: primaryCoachId || undefined,
        status,
      });

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

  if (!open || !externalId) return null;

  const canSubmit = fullName.trim() !== "" && sportId !== "" && batchId !== "";
  const sportDisabled = sportOptions.length === 0;
  const batchDisabled = !sportId;
  const coachDisabled = !batchId;
  const coachPlaceholder = !batchId
    ? "Select batch first"
    : coachesForBatch.length === 0
      ? "No coaches assigned to this batch"
      : "No coach assigned";
  const maxDateOfBirth = new Date().toISOString().slice(0, 10);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink/50"
        aria-label="Close edit player modal"
        onClick={handleClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-player-title"
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-(--radius) shadow-card border border-line"
      >
        <form onSubmit={handleSubmit} className="px-6 py-6">
          <h2 id="edit-player-title" className="text-xl font-bold text-ink tracking-tight">
            Edit player
          </h2>
          <p className="text-[13px] text-muted mt-1.5 mb-5">
            Update player details for <b className="text-text">{externalId}</b>.
          </p>

          {error && (
            <p className="text-[13px] font-medium text-red mb-4" role="alert">
              {error}
            </p>
          )}

          {isLoading ? (
            <p className="text-[13px] text-muted py-8 text-center">Loading player…</p>
          ) : (
            <>
              <AuthField
                label="Full name"
                placeholder="Player full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                required
              />

              <InlineFieldGroup className="mb-4">
                <InlineDropdown
                  label="Sport"
                  id={id("sport")}
                  value={sportId}
                  onChange={setSportId}
                  options={sportOptions}
                  placeholder={sportDisabled ? "No sports available" : "Select sport"}
                  disabled={sportDisabled}
                  required
                />

                <InlineDropdown
                  label="Batch"
                  id={id("batch")}
                  value={batchId}
                  onChange={setBatchId}
                  options={batchOptions}
                  placeholder={!sportId ? "Select sport first" : "Select batch"}
                  required
                  disabled={batchDisabled}
                />

                <InlineDropdown
                  label="Coach"
                  id={id("coach")}
                  value={primaryCoachId}
                  onChange={setPrimaryCoachId}
                  options={[{ value: "", label: "No coach assigned" }, ...coachOptions]}
                  placeholder={coachPlaceholder}
                  disabled={coachDisabled}
                />

                <InlineDropdown
                  label="Status"
                  id={id("status")}
                  value={status}
                  onChange={(value) => setStatus(value as "active" | "on_hold")}
                  options={STATUS_OPTIONS}
                  placeholder="Select status"
                />
              </InlineFieldGroup>

              <InlineFieldGroup className="mb-4">
                <InlineInput
                  label="Weight"
                  id={id("weight")}
                  value={weightCategory}
                  onChange={(e) => setWeightCategory(e.target.value)}
                  placeholder="e.g. 65"
                  suffix="kg"
                />
                <InlineInput
                  label="Height"
                  id={id("height")}
                  value={heightCategory}
                  onChange={(e) => setHeightCategory(e.target.value)}
                  placeholder="e.g. 170cm"
                />
                <InlineDatePicker
                  label="Date of birth"
                  id={id("dob")}
                  value={dateOfBirth}
                  onChange={setDateOfBirth}
                  placeholder="Select date of birth"
                  maxDate={maxDateOfBirth}
                />
                <InlineInput
                  label="Monthly fee"
                  id={id("fee")}
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={monthlyFee}
                  onChange={(e) => setMonthlyFee(e.target.value)}
                  placeholder="₹ 1500"
                />
              </InlineFieldGroup>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
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
                  disabled={!canSubmit || isSubmitting}
                  className="inline-flex items-center justify-center bg-brand text-white font-semibold text-[13px] py-[11px] px-4 rounded-[10px] disabled:opacity-50"
                >
                  {isSubmitting ? "Saving changes…" : "Save changes"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
