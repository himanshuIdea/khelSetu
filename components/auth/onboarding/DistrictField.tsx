"use client";

import { useId, useMemo, useRef, useState } from "react";

function PinIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-muted2 shrink-0"
      aria-hidden
    >
      <path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  );
}

type DistrictFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  suggestions: readonly string[];
  onChange: (value: string) => void;
};

export function DistrictField({
  label,
  placeholder,
  value,
  suggestions,
  onChange,
}: DistrictFieldProps) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (!query) return [...suggestions];
    return suggestions.filter((district) => district.toLowerCase().includes(query));
  }, [suggestions, value]);

  function selectDistrict(district: string) {
    onChange(district);
    setOpen(false);
    inputRef.current?.blur();
  }

  return (
    <div className="flex-1">
      <label htmlFor={listId} className="block text-[12.5px] font-semibold text-text mb-2">
        {label}
      </label>
      <div className="relative">
        <div
          className={`w-full border rounded-[11px] px-[15px] py-[13px] text-[13.5px] text-ink bg-white flex items-center justify-between gap-2 transition-colors ${
            open ? "border-brand ring-1 ring-brand/30" : "border-line"
          }`}
        >
          <input
            ref={inputRef}
            id={listId}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setOpen(true)}
            onBlur={() => window.setTimeout(() => setOpen(false), 120)}
            placeholder={placeholder}
            autoComplete="address-level2"
            className="flex-1 outline-none bg-transparent font-sans min-w-0"
            required
          />
          <PinIcon />
        </div>

        {open && filtered.length > 0 && (
          <ul className="absolute z-20 mt-1.5 w-full max-h-44 overflow-y-auto bg-white border border-line rounded-[11px] shadow-card py-1">
            {filtered.map((district) => (
              <li key={district}>
                <button
                  type="button"
                  className={`w-full text-left px-3.5 py-2.5 text-[13px] transition-colors ${
                    district === value
                      ? "bg-brand-soft text-brand-d font-semibold"
                      : "text-text hover:bg-surface"
                  }`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectDistrict(district)}
                >
                  {district}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
