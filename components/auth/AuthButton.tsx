import { ButtonHTMLAttributes } from "react";

type AuthButtonProps = {
  variant?: "primary" | "ghost";
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function AuthButton({
  variant = "primary",
  className = "",
  children,
  ...props
}: AuthButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-1.5 font-semibold text-[13px] px-4 py-[11px] rounded-[10px] border-none cursor-pointer transition-opacity disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-brand text-white hover:opacity-90",
    ghost: "bg-card text-text border border-line hover:bg-surface",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

function ChevronRight() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="rotate-180"
    >
      <path d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  );
}

function Spinner() {
  return (
    <span
      className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin shrink-0"
      aria-hidden
    />
  );
}

export function AuthContinueButton({
  label = "Continue",
  loading = false,
  ...props
}: AuthButtonProps & { label?: string; loading?: boolean }) {
  const { disabled, ...rest } = props;

  return (
    <AuthButton variant="primary" disabled={loading || disabled} {...rest}>
      {loading ? <Spinner /> : null}
      {label}
      {!loading ? <ChevronRight /> : null}
    </AuthButton>
  );
}
