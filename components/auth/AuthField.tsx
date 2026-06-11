import { InputHTMLAttributes } from "react";

type AuthFieldProps = {
  label: string;
} & InputHTMLAttributes<HTMLInputElement>;

export function AuthField({ label, className = "", ...props }: AuthFieldProps) {
  return (
    <div className="mb-5">
      <label className="block text-[12.5px] font-semibold text-text mb-2">
        {label}
      </label>
      <input
        className={`w-full border border-line rounded-[11px] px-[15px] py-[13px] text-[13.5px] text-ink font-sans bg-white outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 placeholder:text-muted2 ${className}`}
        {...props}
      />
    </div>
  );
}
