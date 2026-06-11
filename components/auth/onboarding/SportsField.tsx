"use client";

import { useEffect, useRef, useState } from "react";

function PlusIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

type SportsFieldProps = {
  label: string;
  addLabel: string;
  sports: string[];
  suggestions: readonly string[];
  onChange: (sports: string[]) => void;
};

export function SportsField({
  label,
  addLabel,
  sports,
  suggestions,
  onChange,
}: SportsFieldProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding) inputRef.current?.focus();
  }, [isAdding]);

  const filtered = suggestions.filter(
    (sport) =>
      !sports.includes(sport) && sport.toLowerCase().includes(query.trim().toLowerCase())
  );

  const quickPicks = suggestions.filter((sport) => !sports.includes(sport)).slice(0, 6);

  function addSport(name: string) {
    const trimmed = name.trim();
    if (!trimmed || sports.includes(trimmed)) return;
    onChange([...sports, trimmed]);
    setQuery("");
    setIsAdding(false);
  }

  function removeSport(name: string) {
    onChange(sports.filter((sport) => sport !== name));
  }

  return (
    <div className="mb-5">
      <label className="block text-[12.5px] font-semibold text-text mb-2">{label}</label>

      <div className="flex flex-wrap gap-2">
        {sports.map((sport) => (
          <button
            key={sport}
            type="button"
            onClick={() => removeSport(sport)}
            className="text-[12.5px] font-semibold px-3.5 py-2 rounded-[10px] bg-brand-soft text-brand-d border border-[#FFD9C5] flex items-center gap-1.5 transition-transform active:scale-[0.97] touch-manipulation"
            title="Tap to remove"
          >
            {sport}
            <span className="text-brand/70 text-[11px] leading-none" aria-hidden>
              ×
            </span>
          </button>
        ))}

        {isAdding ? (
          <div className="relative min-w-[min(100%,200px)] flex-1">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSport(query || filtered[0] || "");
                }
                if (e.key === "Escape") {
                  setIsAdding(false);
                  setQuery("");
                }
              }}
              onBlur={() => {
                window.setTimeout(() => setIsAdding(false), 120);
              }}
              placeholder="Type sport name"
              className="w-full border border-brand rounded-[10px] px-3.5 py-2 text-[12.5px] text-ink bg-white outline-none ring-2 ring-brand/20 font-sans"
            />
            {filtered.length > 0 && (
              <ul className="absolute z-20 mt-1.5 w-full max-h-40 overflow-y-auto bg-white border border-line rounded-[11px] shadow-card py-1">
                {filtered.slice(0, 8).map((sport) => (
                  <li key={sport}>
                    <button
                      type="button"
                      className="w-full text-left px-3.5 py-2.5 text-[13px] text-text hover:bg-surface transition-colors"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => addSport(sport)}
                    >
                      {sport}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="text-[12.5px] font-semibold px-3.5 py-2 rounded-[10px] bg-white text-muted border border-dashed border-line flex items-center gap-1.5 hover:border-muted2 hover:text-text transition-colors active:scale-[0.97] touch-manipulation"
          >
            <PlusIcon />
            {addLabel}
          </button>
        )}
      </div>

      {quickPicks.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
          <span className="text-[11px] font-medium text-muted2 mr-0.5">Suggested</span>
          {quickPicks.map((sport) => (
            <button
              key={sport}
              type="button"
              onClick={() => addSport(sport)}
              className="text-[11.5px] font-medium px-2.5 py-1 rounded-full bg-surface text-muted hover:bg-brand-soft hover:text-brand-d transition-colors active:scale-[0.97] touch-manipulation"
            >
              + {sport}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
