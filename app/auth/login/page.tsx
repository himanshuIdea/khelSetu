"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthField } from "@/components/auth/AuthField";
import { AuthModeToggle } from "@/components/auth/AuthModeToggle";
import { AuthContinueButton } from "@/components/auth/AuthButton";
import { authConfig, AuthMode } from "@/lib/auth-config";
import { api, ApiError } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { login } = authConfig;
  const [mode, setMode] = useState<AuthMode>("password");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit =
    mode === "password"
      ? identifier.trim() !== "" && password.trim() !== ""
      : phone.trim() !== "" && otp.trim() !== "";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit || isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const result =
        mode === "password"
          ? await api.auth.login({
              mode: "password",
              email: identifier.trim(),
              password,
            })
          : await api.auth.login({
              mode: "otp",
              phone: phone.trim(),
              otp: otp.trim(),
            });

      router.push(result.redirectTo);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
      setIsSubmitting(false);
    }
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

        {error && (
          <p className="text-[13px] font-medium text-red mb-4" role="alert">
            {error}
          </p>
        )}

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

        <div className="mt-auto flex flex-col gap-6 pt-8">
          <div className="flex justify-end">
            <AuthContinueButton
              type="submit"
              label={isSubmitting ? "Signing in…" : login.continueLabel}
              disabled={!canSubmit || isSubmitting}
              loading={isSubmitting}
            />
          </div>
          <p className="text-[13px] text-muted text-center sm:text-left">
            {login.signUpPrompt}{" "}
            <Link href="/auth/sign-up" className="font-semibold text-brand hover:underline">
              {login.signUpLabel}
            </Link>
          </p>
        </div>
      </form>
    </AuthShell>
  );
}
