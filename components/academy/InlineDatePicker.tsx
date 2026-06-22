"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { InlineRow } from "@/components/academy/InlineFormFields";

const PANEL_GAP = 6;
const PANEL_WIDTH = 280;
const PANEL_ESTIMATED_HEIGHT = 320;

type PanelPosition = {
  top: number;
  left: number;
  width: number;
};

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

type PickerView = "calendar" | "month" | "year";

function CalendarIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-muted2 shrink-0"
      aria-hidden
    >
      <path d="M8 2v4M16 2v4M3.5 10h17M5 6h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function parseIsoDate(value: string): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value: string): string {
  const date = parseIsoDate(value);
  if (!date) return "";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function buildCalendarDays(month: Date) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1);
  const startOffset = firstDay.getDay();
  const gridStart = new Date(year, monthIndex, 1 - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
}

type InlineDatePickerProps = {
  label: string;
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  maxDate?: string;
  layout?: "inline" | "stacked";
  tone?: "light" | "dark";
  /** Tailwind z-index class for the portaled panel (default `z-[60]`). Use `z-[70]` inside nested modals. */
  panelZIndexClass?: string;
};

export function InlineDatePicker({
  label,
  id,
  value,
  onChange,
  placeholder = "Select date",
  disabled = false,
  maxDate,
  layout = "inline",
  tone = "light",
  panelZIndexClass = "z-[60]",
}: InlineDatePickerProps) {
  const generatedId = useId();
  const triggerId = id ?? generatedId;
  const panelId = `${triggerId}-panel`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const monthListRef = useRef<HTMLDivElement>(null);
  const yearListRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [pickerView, setPickerView] = useState<PickerView>("calendar");
  const [position, setPosition] = useState<PanelPosition>({ top: 0, left: 0, width: PANEL_WIDTH });
  const [viewMonth, setViewMonth] = useState(() => parseIsoDate(value) ?? new Date());

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const panel = panelRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const panelHeight = panel?.offsetHeight ?? PANEL_ESTIMATED_HEIGHT;
    const panelWidth = Math.max(PANEL_WIDTH, rect.width);
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < panelHeight + PANEL_GAP;

    setPosition({
      top: openUpward ? rect.top - panelHeight - PANEL_GAP : rect.bottom + PANEL_GAP,
      left: Math.max(8, Math.min(rect.left, window.innerWidth - panelWidth - 8)),
      width: panelWidth,
    });
  }, []);

  const maxDateValue = useMemo(() => (maxDate ? parseIsoDate(maxDate) : null), [maxDate]);
  const selectedDate = useMemo(() => parseIsoDate(value), [value]);
  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const days = useMemo(() => buildCalendarDays(viewMonth), [viewMonth]);
  const monthName = MONTHS[viewMonth.getMonth()];
  const viewYear = viewMonth.getFullYear();

  const maxYear = maxDateValue?.getFullYear() ?? today.getFullYear();
  const minYear = maxYear - 80;
  const years = useMemo(
    () => Array.from({ length: maxYear - minYear + 1 }, (_, index) => maxYear - index),
    [maxYear, minYear]
  );

  useEffect(() => {
    const date = parseIsoDate(value);
    if (date) {
      setViewMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  }, [value]);

  useEffect(() => {
    if (!open) {
      setPickerView("calendar");
      return;
    }

    updatePosition();

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        if (pickerView !== "calendar") {
          setPickerView("calendar");
          return;
        }
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, pickerView, updatePosition]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, pickerView, updatePosition]);

  useEffect(() => {
    if (!open || pickerView !== "month") return;

    const selected = monthListRef.current?.querySelector('[data-selected="true"]');
    selected?.scrollIntoView({ block: "center" });
  }, [open, pickerView, viewMonth]);

  useEffect(() => {
    if (!open || pickerView !== "year") return;

    const selected = yearListRef.current?.querySelector('[data-selected="true"]');
    selected?.scrollIntoView({ block: "center" });
  }, [open, pickerView, viewYear]);

  function isDisabledDate(date: Date) {
    if (maxDateValue && date > maxDateValue) return true;
    return false;
  }

  function isMonthDisabled(monthIndex: number) {
    if (!maxDateValue) return false;
    const firstDayOfMonth = new Date(viewYear, monthIndex, 1);
    return firstDayOfMonth > maxDateValue;
  }

  function selectDate(date: Date) {
    if (isDisabledDate(date)) return;
    onChange(toIsoDate(date));
    setOpen(false);
  }

  function shiftMonth(delta: number) {
    setViewMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  }

  function selectMonth(monthIndex: number) {
    if (isMonthDisabled(monthIndex)) return;
    setViewMonth(new Date(viewYear, monthIndex, 1));
    setPickerView("calendar");
  }

  function selectYear(year: number) {
    setViewMonth(new Date(year, viewMonth.getMonth(), 1));
    setPickerView("month");
  }

  const displayValue = value ? formatDisplayDate(value) : placeholder;
  const isStacked = layout === "stacked";

  const triggerClassName = `flex items-center gap-2 text-left text-[13.5px] transition-colors touch-manipulation ${
    isStacked
      ? "w-full justify-between min-h-[44px] rounded-[10px] px-3 py-2"
      : "w-2/3 ml-3 rounded-[10px] px-1 py-2"
  } ${
    tone === "dark"
      ? `bg-white/8 border-none ${
          disabled
            ? "text-[#A9B5D1] cursor-not-allowed opacity-50"
            : open
              ? "bg-white/12 text-white ring-1 ring-white/20"
              : value
                ? "text-[#C7D0E6] hover:bg-white/12 hover:text-white"
                : "text-[#A9B5D1] hover:bg-white/12 hover:text-white"
        }`
      : `${
          disabled
            ? "text-muted2 cursor-not-allowed"
            : open
              ? "bg-brand-soft text-ink ring-1 ring-brand/25"
              : "text-ink hover:bg-surface"
        } ${!value ? "text-muted2" : ""}`
  }`;

  const pickerPanel =
    open && !disabled ? (
          <div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-label="Choose date"
            style={{
              position: "fixed",
              top: position.top,
              left: position.left,
              width: position.width,
            }}
            className={`${panelZIndexClass} bg-white border border-line rounded-[11px] shadow-card p-3`}
          >
            {pickerView === "calendar" && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <button
                    type="button"
                    onClick={() => shiftMonth(-1)}
                    className="w-8 h-8 inline-flex items-center justify-center rounded-[8px] text-muted hover:bg-surface hover:text-ink transition-colors"
                    aria-label="Previous month"
                  >
                    <ChevronLeftIcon />
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPickerView("month")}
                      className="text-[13px] font-semibold text-ink px-2 py-1 rounded-[8px] hover:bg-surface transition-colors"
                    >
                      {monthName}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPickerView("year")}
                      className="text-[13px] font-semibold text-ink px-2 py-1 rounded-[8px] hover:bg-surface transition-colors"
                    >
                      {viewYear}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => shiftMonth(1)}
                    className="w-8 h-8 inline-flex items-center justify-center rounded-[8px] text-muted hover:bg-surface hover:text-ink transition-colors"
                    aria-label="Next month"
                  >
                    <ChevronRightIcon />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-1">
                  {WEEKDAYS.map((day) => (
                    <div
                      key={day}
                      className="text-[10.5px] font-semibold uppercase tracking-wide text-muted text-center py-1"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {days.map((date) => {
                    const inMonth = date.getMonth() === viewMonth.getMonth();
                    const selected = selectedDate ? isSameDay(date, selectedDate) : false;
                    const isToday = isSameDay(date, today);
                    const disabledDay = isDisabledDate(date);

                    return (
                      <button
                        key={toIsoDate(date)}
                        type="button"
                        disabled={disabledDay}
                        onClick={() => selectDate(date)}
                        className={`h-8 rounded-[8px] text-[12.5px] font-medium transition-colors ${
                          selected
                            ? "bg-brand text-white"
                            : isToday
                              ? "bg-brand-soft text-brand-d"
                              : inMonth
                                ? "text-ink hover:bg-surface"
                                : "text-muted2 hover:bg-surface"
                        } ${disabledDay ? "opacity-40 cursor-not-allowed hover:bg-transparent" : ""}`}
                      >
                        {date.getDate()}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {pickerView === "month" && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <button
                    type="button"
                    onClick={() => setPickerView("calendar")}
                    className="text-[12px] font-semibold text-muted hover:text-text"
                  >
                    Back
                  </button>
                  <div className="text-[13px] font-semibold text-ink">{viewYear}</div>
                  <button
                    type="button"
                    onClick={() => setPickerView("year")}
                    className="text-[12px] font-semibold text-brand hover:text-brand-d"
                  >
                    Year
                  </button>
                </div>

                <div
                  ref={monthListRef}
                  className="max-h-52 overflow-y-auto grid grid-cols-3 gap-1.5 pr-1"
                >
                  {MONTHS.map((name, monthIndex) => {
                    const isSelected = viewMonth.getMonth() === monthIndex;
                    const monthDisabled = isMonthDisabled(monthIndex);

                    return (
                      <button
                        key={name}
                        type="button"
                        data-selected={isSelected ? "true" : undefined}
                        disabled={monthDisabled}
                        onClick={() => selectMonth(monthIndex)}
                        className={`py-2.5 px-2 rounded-[8px] text-[12.5px] font-medium transition-colors ${
                          isSelected
                            ? "bg-brand text-white"
                            : "text-ink hover:bg-surface"
                        } ${monthDisabled ? "opacity-40 cursor-not-allowed hover:bg-transparent" : ""}`}
                      >
                        {name.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {pickerView === "year" && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <button
                    type="button"
                    onClick={() => setPickerView("calendar")}
                    className="text-[12px] font-semibold text-muted hover:text-text"
                  >
                    Back
                  </button>
                  <div className="text-[13px] font-semibold text-ink">Select year</div>
                  <span className="w-10" aria-hidden />
                </div>

                <div ref={yearListRef} className="max-h-52 overflow-y-auto pr-1">
                  <div className="grid grid-cols-3 gap-1.5">
                    {years.map((year) => {
                      const isSelected = viewYear === year;

                      return (
                        <button
                          key={year}
                          type="button"
                          data-selected={isSelected ? "true" : undefined}
                          onClick={() => selectYear(year)}
                          className={`py-2.5 px-2 rounded-[8px] text-[12.5px] font-medium transition-colors ${
                            isSelected
                              ? "bg-brand text-white"
                              : "text-ink hover:bg-surface"
                          }`}
                        >
                          {year}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
    ) : null;

  const triggerButton = (
    <button
      ref={triggerRef}
      id={triggerId}
      type="button"
      disabled={disabled}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls={panelId}
      onClick={() => !disabled && setOpen((current) => !current)}
      className={triggerClassName}
    >
      <span className="truncate">{displayValue}</span>
      <CalendarIcon />
    </button>
  );

  const portaledPanel = mounted && pickerPanel ? createPortal(pickerPanel, document.body) : null;

  if (isStacked) {
    return (
      <div className="min-w-0">
        <label
          htmlFor={triggerId}
          className={`block text-[11px] font-semibold uppercase tracking-[0.5px] mb-1.5 ${
            tone === "dark" ? "text-[#A9B5D1]" : "text-muted2"
          }`}
        >
          {label}
        </label>
        {triggerButton}
        {portaledPanel}
      </div>
    );
  }

  return (
    <InlineRow label={label} htmlFor={triggerId}>
      {triggerButton}
      {portaledPanel}
    </InlineRow>
  );
}
