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
import { PlusIcon } from "@/components/academy/icons";
import { AuthField } from "@/components/auth/AuthField";
import { api, ApiError } from "@/lib/api";
import {
  dedupeFormBatches,
  getBatchLabel,
  inferBatchFromDateOfBirth,
} from "@/lib/batches";
import {
  getCoachesForBatch,
  getPrimaryCoachIdForBatch,
  type PlayerFormOptions,
} from "@/lib/players";

type AddPlayerModalProps = {
  academyId: string;
  open: boolean;
  onClose: () => void;
  formOptions: PlayerFormOptions;
};

const STATUS_OPTIONS: DropdownOption[] = [
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On hold" },
];

export function AddPlayerModal({
  academyId,
  open,
  onClose,
  formOptions,
}: AddPlayerModalProps) {
  const router = useRouter();
  const fieldIds = useId();
  const id = (name: string) => `${fieldIds}-${name}`;

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
      if (event.key === "Escape") onClose();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    setBatchId("");
    setPrimaryCoachId("");
  }, [sportId]);

  useEffect(() => {
    if (!batchId) {
      setPrimaryCoachId("");
      return;
    }
    setPrimaryCoachId(getPrimaryCoachIdForBatch(formOptions, batchId));
  }, [batchId, formOptions]);

  useEffect(() => {
    if (!dateOfBirth || !sportId) return;

    const suggestedBatch = inferBatchFromDateOfBirth(dateOfBirth);
    if (!suggestedBatch) return;

    const match = batchesForSport.find((batch) => batch.name === suggestedBatch);
    if (match) setBatchId(match.id);
  }, [dateOfBirth, sportId, batchesForSport]);

  function resetForm() {
    setFullName("");
    setSportId("");
    setBatchId("");
    setWeightCategory("");
    setHeightCategory("");
    setDateOfBirth("");
    setMonthlyFee("");
    setPrimaryCoachId("");
    setStatus("active");
    setError(null);
  }

  function handleClose() {
    if (isSubmitting) return;
    resetForm();
    onClose();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const monthlyFeePaise =
        monthlyFee.trim() === "" ? undefined : Math.round(Number(monthlyFee) * 100);

      await api.players.create(academyId, {
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
        aria-label="Close add player modal"
        onClick={handleClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-player-title"
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-(--radius) shadow-card border border-line"
      >
        <form onSubmit={handleSubmit} className="px-6 py-6">
          <h2 id="add-player-title" className="text-xl font-bold text-ink tracking-tight">
            Add player
          </h2>
          <p className="text-[13px] text-muted mt-1.5 mb-5">
            Enter player details to onboard them into your academy roster.
          </p>

          {error && (
            <p className="text-[13px] font-medium text-red mb-4" role="alert">
              {error}
            </p>
          )}

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
              className="inline-flex items-center justify-center gap-[7px] bg-brand text-white font-semibold text-[13px] py-[11px] px-4 rounded-[10px] disabled:opacity-50"
            >
              <PlusIcon />
              {isSubmitting ? "Adding player…" : "Add player"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
