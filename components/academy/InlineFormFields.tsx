"use client";

import { InlineSelect, type SelectOption } from "@/components/academy/InlineSelect";

export type DropdownOption = SelectOption;

function InlineFieldGroup({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`border border-line rounded-[11px] overflow-visible bg-white divide-y divide-line2 ${className}`}
    >
      {children}
    </div>
  );
}

export { InlineFieldGroup };

type InlineRowProps = {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
};

export function InlineRow({ label, htmlFor, children }: InlineRowProps) {
  return (
    <div className="flex items-center gap-3 px-[15px] min-h-[48px]">
      <label
        htmlFor={htmlFor}
        className="w-[108px] shrink-0 text-[12.5px] font-semibold text-text"
      >
        {label}
      </label>
      <div className="relative flex-1 min-w-0 py-[7px]">{children}</div>
    </div>
  );
}

const inputClassName =
  "w-full bg-transparent text-[13.5px] text-ink font-sans outline-none placeholder:text-muted2 disabled:text-muted2 disabled:cursor-not-allowed";

type InlineInputProps = {
  label: string;
  id: string;
  suffix?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export function InlineInput({ label, id, suffix, className = "", ...props }: InlineInputProps) {
  return (
    <InlineRow label={label} htmlFor={id}>
      <div className="flex items-center gap-2 min-w-0">
        <input id={id} className={`${inputClassName} py-1 pl-4 min-w-0 flex-1 ${className}`} {...props} />
        {suffix ? (
          <span className="text-[13px] text-muted shrink-0 pr-1" aria-hidden>
            {suffix}
          </span>
        ) : null}
      </div>
    </InlineRow>
  );
}

type InlineDropdownProps = {
  label: string;
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder: string;
  disabled?: boolean;
  required?: boolean;
  menuZIndexClass?: string;
};

export function InlineDropdown({
  label,
  id,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  required = false,
  menuZIndexClass,
}: InlineDropdownProps) {
  return (
    <InlineRow label={label} htmlFor={id}>
      <InlineSelect
        id={id}
        value={value}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        menuZIndexClass={menuZIndexClass}
        className="w-full"
      />
    </InlineRow>
  );
}
