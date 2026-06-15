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
import type { ItemCondition } from "@/lib/inventory";

type AddItemModalProps = {
  academyId: string;
  sports: { id: string; name: string }[];
  open: boolean;
  onClose: () => void;
};

const CONDITION_OPTIONS: DropdownOption[] = [
  { value: "good", label: "Good" },
  { value: "worn", label: "Worn" },
  { value: "damaged", label: "Damaged" },
];

export function AddItemModal({ academyId, sports, open, onClose }: AddItemModalProps) {
  const router = useRouter();
  const fieldIds = useId();
  const id = (name: string) => `${fieldIds}-${name}`;

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState<ItemCondition>("good");
  const [inStock, setInStock] = useState("0");
  const [lowStockThreshold, setLowStockThreshold] = useState("10");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasSports = sports.length > 0;
  const defaultCategory = hasSports ? sports[0].name : "";

  const categoryOptions = useMemo<DropdownOption[]>(
    () => sports.map((sport) => ({ value: sport.name, label: sport.name })),
    [sports]
  );

  useEffect(() => {
    if (!open) {
      setIsSubmitting(false);
      return;
    }
    setCategory(defaultCategory);
    setIsSubmitting(false);
  }, [open, defaultCategory]);

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

  function resetForm() {
    setName("");
    setCategory(defaultCategory);
    setCondition("good");
    setInStock("0");
    setLowStockThreshold("10");
    setError(null);
    setIsSubmitting(false);
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
      await api.inventory.createItem(academyId, {
        name: name.trim(),
        category,
        condition,
        inStock: Number(inStock),
        lowStockThreshold: Number(lowStockThreshold),
      });

      resetForm();
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!open) return null;

  const canSubmit = hasSports && name.trim() !== "" && category !== "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink/50"
        aria-label="Close add item dialog"
        onClick={handleClose}
      />

      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-lg bg-white rounded-(--radius) shadow-card border border-line max-h-[90vh] overflow-y-auto"
      >
        <div className="px-6 pt-6 pb-2">
          <h2 className="text-xl font-bold text-ink tracking-tight">Add inventory item</h2>
          <p className="text-[13px] text-muted mt-1">
            Add kits and equipment to track stock and issue to players.
          </p>
        </div>

        <div className="px-6 py-4 space-y-4">
          <AuthField
            label="Item name"
            placeholder="e.g. Wrestling singlets"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />

          <InlineFieldGroup>
            {!hasSports ? (
              <p className="text-[12.5px] text-muted bg-surface/60 rounded-[10px] px-3 py-2.5">
                Add sports during academy onboarding to categorize inventory items.
              </p>
            ) : null}
            <InlineDropdown
              label="Category"
              id={id("category")}
              value={category}
              onChange={setCategory}
              options={categoryOptions}
              placeholder="Select category"
              disabled={!hasSports}
              required
            />
            <InlineDropdown
              label="Condition"
              id={id("condition")}
              value={condition}
              onChange={(value) => setCondition(value as ItemCondition)}
              options={CONDITION_OPTIONS}
              placeholder="Select condition"
              required
            />
            <InlineInput
              label="In stock"
              id={id("inStock")}
              type="number"
              min={0}
              value={inStock}
              onChange={(event) => setInStock(event.target.value)}
              required
            />
            <InlineInput
              label="Low-stock alert at"
              id={id("threshold")}
              type="number"
              min={0}
              value={lowStockThreshold}
              onChange={(event) => setLowStockThreshold(event.target.value)}
              required
            />
          </InlineFieldGroup>

          {error && (
            <p className="text-[13px] font-medium text-red" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 px-6 pb-6">
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
            <PlusIcon className="w-4 h-4" />
            {isSubmitting ? "Adding…" : "Add item"}
          </button>
        </div>
      </form>
    </div>
  );
}
