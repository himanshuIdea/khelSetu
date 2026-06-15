"use client";

import { FormEvent, useEffect, useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  InlineDropdown,
  InlineFieldGroup,
  type DropdownOption,
} from "@/components/academy/InlineFormFields";
import { PlusIcon } from "@/components/academy/icons";
import { AuthField } from "@/components/auth/AuthField";
import { api, ApiError } from "@/lib/api";
import type { CoachFormOptions } from "@/lib/coaches";

type AddCoachModalProps = {
  academyId: string;
  open: boolean;
  onClose: () => void;
  formOptions: CoachFormOptions;
};

const NIS_OPTIONS: DropdownOption[] = [
  { value: "in_review", label: "In review" },
  { value: "nis_level_1", label: "NIS Level 1" },
  { value: "nis_level_2", label: "NIS Level 2" },
];

export function AddCoachModal({
  academyId,
  open,
  onClose,
  formOptions,
}: AddCoachModalProps) {
  const router = useRouter();
  const fieldIds = useId();
  const id = (name: string) => `${fieldIds}-${name}`;

  const [fullName, setFullName] = useState("");
  const [sportId, setSportId] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [nisLevel, setNisLevel] = useState<"nis_level_1" | "nis_level_2" | "in_review">("in_review");
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
    setFullName("");
    setSportId("");
    setRoleTitle("");
    setNisLevel("in_review");
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
      await api.coaches.create(academyId, {
        fullName: fullName.trim(),
        sportId,
        roleTitle: roleTitle.trim() || undefined,
        nisLevel,
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

  const canSubmit = fullName.trim() !== "" && sportId !== "";
  const sportDisabled = sportOptions.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink/50"
        aria-label="Close add coach modal"
        onClick={handleClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-coach-title"
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-(--radius) shadow-card border border-line"
      >
        <form onSubmit={handleSubmit} className="px-6 py-6">
          <h2 id="add-coach-title" className="text-xl font-bold text-ink tracking-tight">
            Add coach
          </h2>
          <p className="text-[13px] text-muted mt-1.5 mb-5">
            Onboard a new coach and assign them to a sport at your academy.
          </p>

          {error && (
            <p className="text-[13px] font-medium text-red mb-4" role="alert">
              {error}
            </p>
          )}

          <AuthField
            label="Full name"
            placeholder="Coach full name"
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
              label="NIS certification"
              id={id("nis")}
              value={nisLevel}
              onChange={(value) => setNisLevel(value as typeof nisLevel)}
              options={NIS_OPTIONS}
              placeholder="Select certification"
            />
          </InlineFieldGroup>

          <AuthField
            label="Role title"
            placeholder="e.g. Wrestling · Head Coach"
            value={roleTitle}
            onChange={(e) => setRoleTitle(e.target.value)}
          />

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
              {isSubmitting ? "Adding coach…" : "Add coach"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
