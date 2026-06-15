"use client";

import { FormEvent, useEffect, useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  InlineDropdown,
  InlineFieldGroup,
  InlineInput,
  type DropdownOption,
} from "@/components/academy/InlineFormFields";
import { api, ApiError } from "@/lib/api";
import type { ItemCondition } from "@/lib/inventory";
import type { InventoryItem } from "@/lib/repositories/types";

type EditItemModalProps = {
  academyId: string;
  sports: { id: string; name: string }[];
  item: InventoryItem | null;
  open: boolean;
  onClose: () => void;
};

const CONDITION_OPTIONS: DropdownOption[] = [
  { value: "good", label: "Good" },
  { value: "worn", label: "Worn" },
  { value: "damaged", label: "Damaged" },
];

export function EditItemModal({ academyId, sports, item, open, onClose }: EditItemModalProps) {
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

  const categoryOptions = useMemo<DropdownOption[]>(() => {
    const names = new Set(sports.map((sport) => sport.name));
    const options = sports.map((sport) => ({ value: sport.name, label: sport.name }));
    if (category && !names.has(category)) {
      options.unshift({ value: category, label: category });
    }
    return options;
  }, [sports, category]);

  useEffect(() => {
    if (!item || !open) {
      setIsSubmitting(false);
      return;
    }
    setName(item.name);
    setCategory(item.category);
    setCondition(item.conditionValue);
    setInStock(String(item.inStock));
    setLowStockThreshold(String(item.lowStockThreshold));
    setError(null);
    setIsSubmitting(false);
  }, [item, open]);

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

  function handleClose() {
    if (isSubmitting) return;
    onClose();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!item || isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    try {
      await api.inventory.updateItem(academyId, item.id, {
        name: name.trim(),
        category,
        condition,
        inStock: Number(inStock),
        lowStockThreshold: Number(lowStockThreshold),
      });

      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!open || !item) return null;

  const canSubmit = name.trim() !== "" && category !== "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink/50"
        aria-label="Close edit item dialog"
        onClick={handleClose}
      />

      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-lg bg-white rounded-(--radius) shadow-card border border-line max-h-[90vh] overflow-y-auto"
      >
        <div className="px-6 pt-6 pb-2">
          <h2 className="text-xl font-bold text-ink tracking-tight">Edit inventory item</h2>
          <p className="text-[13px] text-muted mt-1">Update item details and stock levels.</p>
        </div>

        <div className="px-6 py-4 space-y-4">
          <InlineFieldGroup>
            <InlineInput
              label="Item name"
              id={id("name")}
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
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

          {item.issued > 0 && (
            <p className="text-[12.5px] text-muted bg-surface/60 rounded-[10px] px-3 py-2.5">
              <b className="text-text">{item.issued}</b> unit(s) currently issued — issued count
              updates automatically when gear is returned.
            </p>
          )}

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
            className="inline-flex items-center justify-center bg-brand text-white font-semibold text-[13px] py-[11px] px-4 rounded-[10px] disabled:opacity-50"
          >
            {isSubmitting ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
