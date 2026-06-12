"use client";

import { FormEvent, useEffect, useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  InlineDropdown,
  InlineFieldGroup,
  InlineInput,
  type DropdownOption,
} from "@/components/academy/InlineFormFields";
import { PlusIcon } from "@/components/academy/icons";
import { AuthField } from "@/components/auth/AuthField";
import { api, ApiError } from "@/lib/api";
import type { TeamFormOptions } from "@/lib/teams";

type AddTeamModalProps = {
  academyId: string;
  open: boolean;
  onClose: () => void;
  formOptions: TeamFormOptions;
};

export function AddTeamModal({
  academyId,
  open,
  onClose,
  formOptions,
}: AddTeamModalProps) {
  const router = useRouter();
  const fieldIds = useId();
  const id = (name: string) => `${fieldIds}-${name}`;

  const [name, setName] = useState("");
  const [sportId, setSportId] = useState("");
  const [coachId, setCoachId] = useState("");
  const [weightClass, setWeightClass] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sportOptions = useMemo<DropdownOption[]>(
    () =>
      formOptions.sports.map((sport) => ({
        value: sport.id,
        label: sport.name,
        color: sport.color,
      })),
    [formOptions.sports]
  );

  const coachesForSport = useMemo(
    () => formOptions.coaches.filter((coach) => coach.sportId === sportId),
    [formOptions.coaches, sportId]
  );

  const coachOptions = useMemo<DropdownOption[]>(
    () => coachesForSport.map((coach) => ({ value: coach.id, label: coach.name })),
    [coachesForSport]
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
    setCoachId("");
  }, [sportId]);

  function resetForm() {
    setName("");
    setSportId("");
    setCoachId("");
    setWeightClass("");
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
      await api.teams.create(academyId, {
        name: name.trim(),
        sportId,
        coachId: coachId || undefined,
        weightClass: weightClass.trim() || undefined,
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

  const canSubmit = name.trim() !== "" && sportId !== "";
  const sportDisabled = sportOptions.length === 0;
  const coachDisabled = !sportId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink/50"
        aria-label="Close create team modal"
        onClick={handleClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-team-title"
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-(--radius) shadow-card border border-line"
      >
        <form onSubmit={handleSubmit} className="px-6 py-6">
          <h2 id="create-team-title" className="text-xl font-bold text-ink tracking-tight">
            Create team
          </h2>
          <p className="text-[13px] text-muted mt-1.5 mb-5">
            Set up a new squad for tournaments and line-up selection.
          </p>

          {error && (
            <p className="text-[13px] font-medium text-red mb-4" role="alert">
              {error}
            </p>
          )}

          <AuthField
            label="Team name"
            placeholder="e.g. Junior Boxing Team"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
              label="Coach"
              id={id("coach")}
              value={coachId}
              onChange={setCoachId}
              options={[{ value: "", label: "No coach assigned" }, ...coachOptions]}
              placeholder={!sportId ? "Select sport first" : "No coach assigned"}
              disabled={coachDisabled}
            />

            <InlineInput
              label="Weight class"
              id={id("weight")}
              value={weightClass}
              onChange={(e) => setWeightClass(e.target.value)}
              placeholder="e.g. 65"
              suffix="kg"
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
              {isSubmitting ? "Creating team…" : "Create team"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
