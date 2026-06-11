"use client";

import { useId } from "react";
import { BRANDED_LINK_MAX, BRANDED_LINK_MIN } from "@/lib/branded-link";

export type SlugStatus = "idle" | "checking" | "available" | "taken" | "invalid" | "unavailable";

function StatusIcon({ status }: { status: SlugStatus }) {
  if (status === "checking") {
    return (
      <span
        className="w-3.5 h-3.5 border-2 border-muted2 border-t-brand rounded-full animate-spin shrink-0"
        aria-hidden
      />
    );
  }

  if (status === "available") {
    return (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-green shrink-0"
        aria-hidden
      >
        <path d="M4.5 12.75l6 6 9-13.5" />
      </svg>
    );
  }

  if (status === "taken" || status === "invalid") {
    return (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="text-red shrink-0"
        aria-hidden
      >
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
    );
  }

  if (status === "unavailable") {
    return (
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="text-amber shrink-0"
        aria-hidden
      >
        <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    );
  }

  return null;
}

type BrandedLinkFieldProps = {
  label: string;
  placeholder: string;
  suffix: string;
  hint: string;
  value: string;
  status: SlugStatus;
  formatError: string | null;
  availabilityMessage: string | null;
  touched: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
};

export function BrandedLinkField({
  label,
  placeholder,
  suffix,
  hint,
  value,
  status,
  formatError,
  availabilityMessage,
  touched,
  onChange,
  onBlur,
}: BrandedLinkFieldProps) {
  const inputId = useId();
  const hintId = `${inputId}-hint`;
  const statusId = `${inputId}-status`;

  const showFormatError = touched && Boolean(formatError);
  const showAvailability =
    value.length > 0 && !formatError && status !== "idle" && status !== "invalid";

  const resolvedAvailabilityMessage =
    status === "checking" ? "Checking availability…" : availabilityMessage;

  const borderClass = showFormatError
    ? "border-red/40"
    : status === "available"
      ? "border-green/40"
      : status === "taken"
        ? "border-red/40"
        : status === "unavailable"
          ? "border-amber/50"
          : "border-line focus-within:border-brand focus-within:ring-1 focus-within:ring-brand/30";

  return (
    <div className="flex-1">
      <label htmlFor={inputId} className="block text-[12.5px] font-semibold text-text mb-2">
        {label}
      </label>
      <div
        className={`w-full border rounded-[11px] px-[15px] py-[13px] text-[13.5px] text-ink bg-white flex items-center gap-2 transition-colors ${borderClass}`}
      >
        <input
          id={inputId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          inputMode="url"
          maxLength={BRANDED_LINK_MAX}
          aria-describedby={`${hintId}${showFormatError || showAvailability ? ` ${statusId}` : ""}`}
          aria-invalid={showFormatError || status === "taken"}
          className="flex-1 outline-none bg-transparent font-sans min-w-0 lowercase"
          required
        />
        <StatusIcon status={showFormatError ? "invalid" : status} />
        <span className="text-muted shrink-0">{suffix}</span>
      </div>

      <p id={hintId} className="text-[11px] text-muted2 mt-1.5 leading-relaxed">
        {hint}
      </p>

      {value.length > 0 && (
        <p className="text-[10.5px] text-muted2 mt-0.5 tabular-nums">
          {value.length}/{BRANDED_LINK_MAX}
          {value.length > 0 && value.length < BRANDED_LINK_MIN
            ? ` · at least ${BRANDED_LINK_MIN} required`
            : null}
        </p>
      )}

      {showFormatError && formatError && (
        <p id={statusId} className="text-[11.5px] mt-1 text-red" role="alert">
          {formatError}
        </p>
      )}

      {showAvailability && resolvedAvailabilityMessage && (
        <p
          id={statusId}
          className={`text-[11.5px] mt-1 ${
            status === "available"
              ? "text-green"
              : status === "taken"
                ? "text-red"
                : status === "unavailable"
                  ? "text-amber"
                  : "text-muted"
          }`}
          role="status"
        >
          {resolvedAvailabilityMessage}
        </p>
      )}

      {status === "available" && value && (
        <p className="text-[11px] text-muted2 mt-1 truncate">
          Preview:{" "}
          <span className="font-medium text-text">
            {value}
            {suffix}
          </span>
        </p>
      )}
    </div>
  );
}
