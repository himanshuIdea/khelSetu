"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CheckIcon } from "@/components/academy/icons";

export type SelectOption = {
  value: string;
  label: string;
};

type MenuPosition = {
  top: number;
  left: number;
  width: number;
};

const MENU_GAP = 6;

function ChevronDownIcon({ open, className = "" }: { open: boolean; className?: string }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 opacity-70 transition-transform duration-200 ${open ? "rotate-180" : ""} ${className}`}
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

type InlineSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  "aria-label"?: string;
  id?: string;
  variant?: "input" | "pill";
  tone?: "light" | "dark";
  required?: boolean;
  /** Tailwind z-index class for the portaled menu (default `z-50`). Use `z-[60]` inside nested modals. */
  menuZIndexClass?: string;
  /** Tailwind max-height class for the portaled menu (default `max-h-44`). */
  menuMaxHeightClass?: string;
  /** When `variant="pill"`, highlight as an active filter (brand border/text). */
  active?: boolean;
  /** When `variant="pill"`, use filter-pill inactive styling (`text-muted`). */
  filterPill?: boolean;
};

export function InlineSelect({
  value,
  onChange,
  options,
  disabled = false,
  className = "",
  placeholder = "Select…",
  "aria-label": ariaLabel,
  id,
  variant = "input",
  tone = "light",
  required = false,
  menuZIndexClass = "z-50",
  menuMaxHeightClass = "max-h-44",
  active = false,
  filterPill = false,
}: InlineSelectProps) {
  const generatedId = useId();
  const triggerId = id ?? generatedId;
  const listboxId = `${triggerId}-listbox`;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition>({ top: 0, left: 0, width: 0 });
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const selected = options.find((option) => option.value === value);
  const displayLabel = selected?.label ?? placeholder;

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    const button = buttonRef.current;
    const menu = menuRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const menuHeight = menu?.offsetHeight ?? options.length * 40 + 8;
    const menuWidth = Math.max(menu?.offsetWidth ?? 0, rect.width);
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < menuHeight + MENU_GAP;

    setPosition({
      top: openUpward ? rect.top - menuHeight - MENU_GAP : rect.bottom + MENU_GAP,
      left: Math.max(8, Math.min(rect.left, window.innerWidth - menuWidth - 8)),
      width: rect.width,
    });
  }, [options.length]);

  useEffect(() => {
    if (!open) return;

    updatePosition();
    const selectedIndex = options.findIndex((option) => option.value === value);
    setHighlightIndex(selectedIndex >= 0 ? selectedIndex : 0);

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition, options, value]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, updatePosition]);

  function selectOption(optionValue: string) {
    onChange(optionValue);
    setOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (disabled) return;

    if (event.key === "Escape") {
      event.stopPropagation();
      setOpen(false);
      return;
    }

    if (!open) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setOpen(true);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightIndex((current) => (current + 1) % options.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightIndex((current) => (current - 1 + options.length) % options.length);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const option = options[highlightIndex];
      if (option) selectOption(option.value);
    }
  }

  const inputTriggerClassName =
    tone === "dark"
      ? `w-full flex items-center justify-between gap-2 min-h-[44px] rounded-[10px] px-3 py-2 text-left text-[13.5px] transition-colors touch-manipulation bg-white/8 border-none ${
          disabled
            ? "text-[#A9B5D1] cursor-not-allowed opacity-50"
            : open
              ? "bg-white/12 text-white ring-1 ring-white/20"
              : selected
                ? "text-[#C7D0E6] hover:bg-white/12 hover:text-white"
                : "text-[#A9B5D1] hover:bg-white/12 hover:text-white"
        }`
      : `w-full flex items-center justify-between gap-2 min-h-[44px] rounded-[10px] px-3 py-2 text-left text-[13.5px] transition-colors touch-manipulation ${
          disabled
            ? "text-muted2 cursor-not-allowed"
            : open
              ? "bg-brand-soft text-ink ring-1 ring-brand/25"
              : "text-ink hover:bg-surface"
        } ${!selected ? "text-muted2" : ""}`;

  const pillToneClassName = active
    ? "border-brand text-brand"
    : filterPill
      ? "border-line text-muted"
      : "border-line text-ink";

  const triggerClassName =
    variant === "pill"
      ? `inline-flex items-center justify-between gap-1.5 min-h-[44px] text-[11px] font-semibold px-2.5 py-1.5 rounded-full border bg-card disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation ${pillToneClassName} ${
          open ? "ring-1 ring-brand/25" : ""
        }`
      : inputTriggerClassName;

  const menu = open && !disabled ? (
    <ul
      ref={menuRef}
      id={listboxId}
      role="listbox"
      aria-labelledby={triggerId}
      style={{ top: position.top, left: position.left, minWidth: position.width }}
      className={`fixed ${menuZIndexClass} min-w-[148px] ${menuMaxHeightClass} overflow-y-auto bg-white border border-line rounded-[11px] shadow-card py-1`}
    >
      {options.length === 0 ? (
        <li className="px-3.5 py-2.5 text-[13px] text-muted" role="presentation">
          {placeholder}
        </li>
      ) : (
        options.map((option, index) => {
          const isSelected = option.value === value;
          const isHighlighted = index === highlightIndex;
          return (
            <li key={option.value || "__empty"} role="option" aria-selected={isSelected}>
              <button
                type="button"
                className={`w-full text-left px-3.5 py-2.5 min-h-[44px] text-[13px] flex items-center gap-2 transition-colors ${
                  isSelected
                    ? "bg-brand-soft text-brand-d font-semibold"
                    : isHighlighted
                      ? "bg-surface text-text"
                      : "text-text hover:bg-surface"
                }`}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setHighlightIndex(index)}
                onClick={() => selectOption(option.value)}
              >
                <span className="flex-1 min-w-0 truncate">{option.label}</span>
                {isSelected ? <CheckIcon className="w-3 h-3 shrink-0" /> : null}
              </button>
            </li>
          );
        })
      )}
    </ul>
  ) : null;

  return (
    <>
      <button
        ref={buttonRef}
        id={triggerId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        onClick={() => !disabled && setOpen((current) => !current)}
        onKeyDown={handleKeyDown}
        className={`${triggerClassName} ${className}`}
      >
        <span className="min-w-0 truncate">{displayLabel}</span>
        <ChevronDownIcon
          open={open}
          className={`${variant === "pill" ? "w-3 h-3" : ""} ${tone === "dark" ? "text-[#A9B5D1]" : ""}`}
        />
      </button>

      {required ? (
        <input
          tabIndex={-1}
          aria-hidden
          className="sr-only"
          value={value}
          onChange={() => undefined}
          required
        />
      ) : null}

      {mounted && menu ? createPortal(menu, document.body) : null}
    </>
  );
}
