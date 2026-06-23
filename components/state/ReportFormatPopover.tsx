"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type ReportFormat = "xlsx" | "pdf";

type ReportFormatPopoverProps = {
  open: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  format: ReportFormat;
  onFormatChange: (format: ReportFormat) => void;
  onDownload: () => void;
  downloading: boolean;
  onClose: () => void;
  error?: string | null;
  helperText?: string;
};

const POPOVER_WIDTH = 240;

function computePosition(anchor: HTMLElement): { top: number; left: number } {
  const rect = anchor.getBoundingClientRect();
  return {
    top: rect.bottom + 6,
    left: Math.max(8, rect.right - POPOVER_WIDTH),
  };
}

export function ReportFormatPopover({
  open,
  anchorRef,
  format,
  onFormatChange,
  onDownload,
  downloading,
  onClose,
  error,
  helperText,
}: ReportFormatPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    setPosition(computePosition(anchor));
  }, [anchorRef]);

  useEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }
    updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;

    let listener: ((event: MouseEvent) => void) | null = null;
    const timer = window.setTimeout(() => {
      listener = (event: MouseEvent) => {
        const target = event.target as Node;
        if (popoverRef.current?.contains(target)) return;
        if (anchorRef.current?.contains(target)) return;
        onClose();
      };
      document.addEventListener("mousedown", listener);
    }, 0);

    return () => {
      window.clearTimeout(timer);
      if (listener) document.removeEventListener("mousedown", listener);
    };
  }, [open, onClose, anchorRef]);

  if (!open || !position) return null;

  return createPortal(
    <div
      ref={popoverRef}
      className="fixed z-[60] w-[240px] bg-card border border-line rounded-[12px] shadow-card p-3"
      style={{ top: position.top, left: position.left }}
    >
      <div className="text-[12px] font-semibold text-ink mb-2">Report format</div>
      <div
        className="flex rounded-[10px] border border-line overflow-hidden mb-3"
        role="group"
        aria-label="Report format"
      >
        <button
          type="button"
          onClick={() => onFormatChange("xlsx")}
          className={`flex-1 min-h-[44px] text-[13px] font-semibold transition-colors ${
            format === "xlsx"
              ? "bg-brand-soft text-brand-d"
              : "bg-card text-muted hover:bg-surface"
          }`}
        >
          Excel
        </button>
        <button
          type="button"
          onClick={() => onFormatChange("pdf")}
          className={`flex-1 min-h-[44px] text-[13px] font-semibold border-l border-line transition-colors ${
            format === "pdf"
              ? "bg-brand-soft text-brand-d"
              : "bg-card text-muted hover:bg-surface"
          }`}
        >
          PDF
        </button>
      </div>
      {helperText ? (
        <p className="mb-3 text-[11.5px] text-muted leading-snug">{helperText}</p>
      ) : null}
      {error ? (
        <div className="mb-3 text-[12px] text-[#D63B3B] bg-red-soft border border-[#F5C2C2] rounded-[8px] px-2.5 py-2">
          {error}
        </div>
      ) : null}
      <button
        type="button"
        onClick={onDownload}
        disabled={downloading}
        className="w-full bg-brand text-white font-semibold text-[13px] py-[10px] px-3 rounded-[10px] disabled:opacity-60"
      >
        {downloading ? "Generating…" : "Download report"}
      </button>
    </div>,
    document.body
  );
}
