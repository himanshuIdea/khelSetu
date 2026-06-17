"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Pill } from "@/components/academy/shared";
import { PlusIcon } from "@/components/academy/icons";
import { AuthField } from "@/components/auth/AuthField";
import { api, ApiError } from "@/lib/api";
import type { StateNurseryDetail, StateNurserySearchResult } from "@/lib/state-nurseries";

type AddNurseryModalProps = {
  open: boolean;
  onClose: () => void;
};

export function AddNurseryModal({ open, onClose }: AddNurseryModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StateNurserySearchResult[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [preview, setPreview] = useState<StateNurseryDetail | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!open) return;

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = window.setTimeout(() => {
      api.state.nurseries
        .search(trimmed)
        .then((response) => {
          setResults(response.results);
          setIsSearching(false);
        })
        .catch(() => {
          setResults([]);
          setIsSearching(false);
        });
    }, 300);

    return () => window.clearTimeout(timer);
  }, [query, open]);

  useEffect(() => {
    if (!open || !selectedId) {
      setPreview(null);
      return;
    }

    let cancelled = false;
    setIsLoadingPreview(true);
    setError(null);

    api.state.nurseries
      .detail(selectedId)
      .then((response) => {
        if (cancelled) return;
        setPreview(response.nursery);
        setIsLoadingPreview(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Could not load academy details.");
        setPreview(null);
        setIsLoadingPreview(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, selectedId]);

  function resetState() {
    setQuery("");
    setResults([]);
    setSelectedId(null);
    setPreview(null);
    setError(null);
    setIsSearching(false);
    setIsLoadingPreview(false);
    setIsSubmitting(false);
  }

  function handleClose() {
    if (isSubmitting) return;
    resetState();
    onClose();
  }

  function handleSelectResult(result: StateNurserySearchResult) {
    setSelectedId(result.academyId);
    setError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!selectedId || isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    try {
      await api.state.nurseries.register(selectedId);
      resetState();
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not register nursery.");
      setIsSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink/50"
        aria-label="Close add nursery modal"
        onClick={handleClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-nursery-title"
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-(--radius) shadow-card border border-line"
      >
        <form onSubmit={handleSubmit} className="px-6 py-6">
          <h2 id="add-nursery-title" className="text-xl font-bold text-ink tracking-tight">
            Add nursery
          </h2>
          <p className="text-[13px] text-muted mt-1.5 mb-5">
            Search for an existing academy in the database and register it as a state-recognized
            sports nursery.
          </p>

          {error && (
            <p className="text-[13px] font-medium text-red mb-4" role="alert">
              {error}
            </p>
          )}

          <AuthField
            label="Search academy"
            placeholder="Type academy name…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedId(null);
              setPreview(null);
            }}
            autoComplete="off"
          />

          {isSearching && (
            <p className="text-[12.5px] text-muted mb-3">Searching…</p>
          )}

          {!isSearching && query.trim().length >= 2 && results.length === 0 && (
            <p className="text-[12.5px] text-muted mb-3 bg-surface border border-line2 rounded-[10px] px-3.5 py-3">
              No unregistered academies match your search.
            </p>
          )}

          {results.length > 0 && (
            <div className="mb-4 border border-line rounded-[10px] divide-y divide-line2 overflow-hidden">
              {results.map((result) => {
                const isSelected = selectedId === result.academyId;
                return (
                  <button
                    key={result.academyId}
                    type="button"
                    onClick={() => handleSelectResult(result)}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 text-left hover:bg-surface/80 ${
                      isSelected ? "bg-brand-soft/40" : ""
                    }`}
                  >
                    <Avatar initials={result.initials} color={result.color} />
                    <div className="min-w-0">
                      <div className="font-semibold text-[13px] text-ink truncate">{result.name}</div>
                      <div className="text-[11.5px] text-muted">{result.detail}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {selectedId && (
            <div className="mb-4 border border-line rounded-[10px] px-4 py-3.5 bg-surface/50">
              {isLoadingPreview ? (
                <p className="text-[13px] text-muted">Loading academy details…</p>
              ) : preview ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar initials={preview.initials} color={preview.color} />
                    <div>
                      <div className="font-semibold text-[14px] text-ink">{preview.name}</div>
                      <div className="text-[12px] text-muted">{preview.locationLabel}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[12.5px]">
                    <div>
                      <span className="text-muted">District</span>
                      <div className="font-medium text-ink">{preview.district}</div>
                    </div>
                    <div>
                      <span className="text-muted">Athletes</span>
                      <div className="font-medium text-ink">{preview.athleteCount}</div>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted">Sports</span>
                      <div className="font-medium text-ink">
                        {preview.sports.length > 0 ? preview.sports.join(", ") : preview.sportLabel}
                      </div>
                    </div>
                  </div>
                  {preview.admin && (
                    <div className="pt-2 border-t border-line2">
                      <div className="text-[11px] uppercase tracking-wide text-muted mb-1">
                        Academy admin
                      </div>
                      <div className="font-semibold text-[13px] text-ink">{preview.admin.fullName}</div>
                      <div className="text-[12px] text-muted">
                        {[preview.admin.email, preview.admin.phone].filter(Boolean).join(" · ") ||
                          "No contact on file"}
                      </div>
                    </div>
                  )}
                  <Pill variant="green">Will register as Verified</Pill>
                </div>
              ) : null}
            </div>
          )}

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
              disabled={!selectedId || !preview || isSubmitting || isLoadingPreview}
              className="inline-flex items-center justify-center gap-[7px] bg-brand text-white font-semibold text-[13px] py-[11px] px-4 rounded-[10px] disabled:opacity-50"
            >
              <PlusIcon />
              {isSubmitting ? "Registering…" : "Register nursery"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
