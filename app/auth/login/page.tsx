"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthField } from "@/components/auth/AuthField";
import { AuthModeToggle } from "@/components/auth/AuthModeToggle";
import { AuthContinueButton } from "@/components/auth/AuthButton";
import { authConfig, AuthMode } from "@/lib/auth-config";
import { saveOnboardingSession } from "@/lib/auth-session";

export default function LoginPage() {
  const router = useRouter();
  const { login } = authConfig;
  const [mode, setMode] = useState<AuthMode>("password");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  const canSubmit =
    mode === "password"
      ? identifier.trim() !== "" && password.trim() !== ""
      : phone.trim() !== "" && otp.trim() !== "";

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    saveOnboardingSession({
      mode,
      identifier: mode === "password" ? identifier.trim() : undefined,
      phone: mode === "otp" ? phone.trim() : undefined,
    });

    router.push("/auth/onboarding");
  }

  return (
    <AuthShell
      headline={login.headline}
      subcopy={login.subcopy}
      activeStep={login.activeStep}
      progressPercent={login.progressPercent}
    >
      <form onSubmit={handleSubmit} className="flex flex-col flex-1 max-w-lg">
        <h3 className="text-xl sm:text-[23px] font-bold text-ink tracking-tight">
          {login.title}
        </h3>
        <p className="text-[13.5px] text-muted mt-1.5 mb-7">{login.subtitle}</p>

        <AuthModeToggle
          mode={mode}
          onChange={setMode}
          passwordLabel={login.modes.password.label}
          otpLabel={login.modes.otp.label}
        />

        {mode === "password" ? (
          <>
            <AuthField
              label={login.modes.password.identifierLabel}
              placeholder={login.modes.password.identifierPlaceholder}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
            />
            <AuthField
              label={login.modes.password.passwordLabel}
              type="password"
              placeholder={login.modes.password.passwordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="text-[13px] font-medium text-brand -mt-2 mb-4 text-left hover:underline"
            >
              {login.modes.password.forgotPasswordLabel}
            </button>
          </>
        ) : (
          <>
            <AuthField
              label={login.modes.otp.phoneLabel}
              type="tel"
              placeholder={login.modes.otp.phonePlaceholder}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
            />
            <AuthField
              label={login.modes.otp.otpLabel}
              placeholder={login.modes.otp.otpPlaceholder}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              inputMode="numeric"
              maxLength={6}
            />
          </>
        )}

        <div className="mt-auto flex justify-end pt-8">
          <AuthContinueButton
            type="submit"
            label={login.continueLabel}
            disabled={!canSubmit}
          />
        </div>
      </form>
    </AuthShell>
  );
}
