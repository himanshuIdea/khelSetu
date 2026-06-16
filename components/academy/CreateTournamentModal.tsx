"use client";

import { FormEvent, useEffect, useId, useState } from "react";
import { InlineFieldGroup, InlineInput } from "@/components/academy/InlineFormFields";
import { PlusIcon } from "@/components/academy/icons";
import { AuthField } from "@/components/auth/AuthField";
import {
  CREATE_TOURNAMENT_DEFAULTS,
  type CreateTournamentFormValues,
} from "@/lib/tournaments-demo";

type CreateTournamentModalProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (values: CreateTournamentFormValues) => void;
};

export function CreateTournamentModal({ open, onClose, onCreate }: CreateTournamentModalProps) {
  const fieldIds = useId();
  const id = (name: string) => `${fieldIds}-${name}`;

  const [form, setForm] = useState<CreateTournamentFormValues>(CREATE_TOURNAMENT_DEFAULTS);

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
    setForm(CREATE_TOURNAMENT_DEFAULTS);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function updateField<K extends keyof CreateTournamentFormValues>(
    key: K,
    value: CreateTournamentFormValues[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onCreate(form);
    resetForm();
    onClose();
  }

  if (!open) return null;

  const canSubmit = form.name.trim() !== "" && form.venue.trim() !== "";

  return (
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
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-(--radius) shadow-card border border-line"
      >
        <form onSubmit={handleSubmit} className="px-6 py-6">
          <h2 id="create-tournament-title" className="text-xl font-bold text-ink tracking-tight">
            Create tournament
          </h2>
          <p className="text-[13px] text-muted mt-1.5 mb-5">
            Demo MVP — set up a read-only tournament view with brackets and mat schedule.
          </p>

          <AuthField
            label="Tournament name"
            placeholder="e.g. Haryana Inter-Academy Wrestling Championship 2026"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            required
          />

          <AuthField
            label="Venue"
            placeholder="e.g. Sonipat"
            value={form.venue}
            onChange={(e) => updateField("venue", e.target.value)}
            required
          />

          <InlineFieldGroup className="mb-4">
            <InlineInput
              label="Start date"
              id={id("start-date")}
              value={form.startDate}
              onChange={(e) => updateField("startDate", e.target.value)}
              placeholder="e.g. 12 March 2026"
            />
            <InlineInput
              label="End date"
              id={id("end-date")}
              value={form.endDate}
              onChange={(e) => updateField("endDate", e.target.value)}
              placeholder="e.g. 14 March 2026"
            />
            <InlineInput
              label="Type"
              id={id("type")}
              value={form.tournamentType}
              onChange={(e) => updateField("tournamentType", e.target.value)}
              placeholder="e.g. Knockout"
            />
            <InlineInput
              label="Sport"
              id={id("sport")}
              value={form.sport}
              onChange={(e) => updateField("sport", e.target.value)}
              placeholder="e.g. Wrestling"
            />
            <InlineInput
              label="Weight class"
              id={id("weight")}
              value={form.weightClass}
              onChange={(e) => updateField("weightClass", e.target.value)}
              placeholder="e.g. 65"
              suffix="kg"
            />
            <InlineInput
              label="Academies"
              id={id("academies")}
              value={form.academiesCount}
              onChange={(e) => updateField("academiesCount", e.target.value)}
              placeholder="e.g. 16"
              inputMode="numeric"
            />
            <InlineInput
              label="Athletes"
              id={id("athletes")}
              value={form.athletesCount}
              onChange={(e) => updateField("athletesCount", e.target.value)}
              placeholder="e.g. 240"
              inputMode="numeric"
            />
            <InlineInput
              label="Description"
              id={id("description")}
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Optional notes"
            />
          </InlineFieldGroup>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="inline-flex items-center justify-center bg-card text-text font-semibold text-[13px] py-[11px] px-4 rounded-[10px] border border-line"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex items-center justify-center gap-[7px] bg-brand text-white font-semibold text-[13px] py-[11px] px-4 rounded-[10px] disabled:opacity-50"
            >
              <PlusIcon />
              Create tournament
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
