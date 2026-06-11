import { AuthMode } from "@/lib/auth-config";

type AuthModeToggleProps = {
  mode: AuthMode;
  onChange: (mode: AuthMode) => void;
  passwordLabel?: string;
  otpLabel?: string;
};

export function AuthModeToggle({
  mode,
  onChange,
  passwordLabel = "Password",
  otpLabel = "OTP",
}: AuthModeToggleProps) {
  return (
    <div className="flex gap-2.5 mb-6">
      {(["password", "otp"] as const).map((option) => {
        const isActive = mode === option;
        const label = option === "password" ? passwordLabel : otpLabel;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`flex-1 min-w-0 border rounded-[11px] px-[13px] py-[13px] text-[13px] font-semibold transition-colors ${
              isActive
                ? "border-brand bg-brand-soft text-brand-d"
                : "border-line text-muted hover:border-muted2"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
