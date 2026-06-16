"use client";

import { FormEvent, useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import {
  InlineDropdown,
  InlineFieldGroup,
  type DropdownOption,
} from "@/components/academy/InlineFormFields";
import { PlusIcon } from "@/components/academy/icons";
import { AuthField } from "@/components/auth/AuthField";
import { api, ApiError } from "@/lib/api";
import { parseSalaryToPaise } from "@/lib/payroll";

type ManageStaffModalProps = {
  academyId: string;
  open: boolean;
  staffId?: string | null;
  onClose: () => void;
};

const EMPLOYMENT_OPTIONS: DropdownOption[] = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
];

export function ManageStaffModal({ academyId, open, staffId, onClose }: ManageStaffModalProps) {
  const router = useRouter();
  const fieldIds = useId();
  const id = (name: string) => `${fieldIds}-${name}`;
  const isEdit = Boolean(staffId);

  const [fullName, setFullName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [employmentType, setEmploymentType] = useState<"full_time" | "part_time">("full_time");
  const [salary, setSalary] = useState("");
  const [isCoach, setIsCoach] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setIsSubmitting(false);
      return;
    }

    if (!staffId) {
      setFullName("");
      setRoleTitle("");
      setEmploymentType("full_time");
      setSalary("");
      setIsCoach(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    api.payroll
      .getStaff(academyId, staffId)
      .then((data) => {
        setFullName(data.fullName);
        setRoleTitle(data.roleTitle);
        setEmploymentType(data.employmentType);
        setSalary(String(data.monthlySalaryPaise / 100));
        setIsCoach(data.isCoach);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Could not load staff member.");
      })
      .finally(() => setLoading(false));
  }, [open, staffId, academyId]);

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

  if (!open) return null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isSubmitting || loading) return;

    const monthlySalaryPaise = parseSalaryToPaise(salary);
    if (monthlySalaryPaise == null) {
      setError("Enter a valid monthly salary.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        fullName: fullName.trim(),
        roleTitle: roleTitle.trim(),
        employmentType,
        monthlySalaryPaise,
        isCoach,
      };

      if (isEdit && staffId) {
        await api.payroll.updateStaff(academyId, staffId, payload);
      } else {
        await api.payroll.createStaff(academyId, payload);
      }

      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink/50"
        aria-label="Close manage staff dialog"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="manage-staff-title"
        className="relative w-full max-w-md bg-card border border-line rounded-(--radius) shadow-card p-5 sm:p-6 max-h-[90vh] overflow-y-auto"
      >
        <h2 id="manage-staff-title" className="text-[17px] font-bold text-ink">
          {isEdit ? "Edit staff member" : "Add employee"}
        </h2>
        <p className="text-[12.5px] text-muted mt-1">
          {isEdit
            ? "Update payroll details. Sport and NIS for coaches are managed on the Coaches page."
            : "Add coaches or support staff. Choose staff type to create a linked coach profile when needed."}
        </p>

        {loading ? (
          <p className="mt-4 text-[13px] text-muted">Loading…</p>
        ) : (
          <form onSubmit={(event) => void handleSubmit(event)} className="mt-4 space-y-1">
            <AuthField
              label="Full name"
              id={id("name")}
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="e.g. Sunita Rani"
              required
            />

            <AuthField
              label="Role title"
              id={id("role")}
              value={roleTitle}
              onChange={(event) => setRoleTitle(event.target.value)}
              placeholder="e.g. Senior Coach · Boxing"
              required
            />

            <InlineFieldGroup>
              <InlineDropdown
                label="Employment"
                id={id("employment")}
                value={employmentType}
                onChange={(value) => setEmploymentType(value as "full_time" | "part_time")}
                options={EMPLOYMENT_OPTIONS}
                placeholder="Select employment"
              />
            </InlineFieldGroup>

            <AuthField
              label="Monthly salary (₹)"
              id={id("salary")}
              value={salary}
              onChange={(event) => setSalary(event.target.value)}
              inputMode="decimal"
              placeholder="42000"
              required
            />

            <div className="mb-5">
              <span className="block text-[12.5px] font-semibold text-text mb-2">Staff type</span>
              <div className="flex flex-col sm:flex-row gap-2.5" role="radiogroup" aria-label="Staff type">
                {(
                  [
                    { value: false, label: "Support staff" },
                    { value: true, label: "Coach" },
                  ] as const
                ).map((option) => {
                  const selected = isCoach === option.value;
                  return (
                    <button
                      key={option.label}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setIsCoach(option.value)}
                      className={`flex-1 border rounded-[11px] px-[13px] py-[13px] text-[13px] font-semibold flex items-center gap-2 transition-all active:scale-[0.98] touch-manipulation min-h-[44px] ${
                        selected
                          ? "border-brand bg-brand-soft text-brand-d shadow-[0_0_0_1px_rgba(255,107,44,0.15)]"
                          : "border-line text-muted hover:border-muted2 hover:text-text"
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full shrink-0 transition-all ${
                          selected
                            ? "border-[5px] border-brand bg-white"
                            : "border-[1.5px] border-line"
                        }`}
                      />
                      {option.label}
                    </button>
                  );
                })}
              </div>
              {isCoach && (
                <p className="text-[12px] text-muted mt-2">
                  Sport, NIS level, and batch assignment are set on the Coaches page after adding.
                </p>
              )}
            </div>

            {error && <p className="text-[12.5px] text-red">{error}</p>}

            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="min-h-[44px] flex-1 rounded-[10px] border border-line bg-card text-[13px] font-semibold text-text disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="min-h-[44px] flex-1 inline-flex items-center justify-center gap-1.5 rounded-[10px] bg-brand text-white text-[13px] font-semibold disabled:opacity-50"
              >
                {!isEdit ? <PlusIcon className="w-4 h-4" /> : null}
                {isSubmitting ? "Saving…" : isEdit ? "Save changes" : "Add staff"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
