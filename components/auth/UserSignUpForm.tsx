"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { AuthField } from "@/components/auth/AuthField";
import { AuthModeToggle } from "@/components/auth/AuthModeToggle";
import { AuthContinueButton } from "@/components/auth/AuthButton";
import { authConfig, AuthMode } from "@/lib/auth-config";
import { api, ApiError } from "@/lib/api";
import { completeAuthRedirect } from "@/lib/auth/complete-auth-redirect";

export function UserSignUpForm() {
  const { signUp } = authConfig;
  const [mode, setMode] = useState<AuthMode>("password");
  const [fullName, setFullName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit =
    fullName.trim() !== "" &&
    (mode === "password"
      ? identifier.trim() !== "" &&
        password.trim() !== "" &&
        confirmPassword.trim() !== ""
      : phone.trim() !== "" && otp.trim() !== "");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit || isSubmitting) return;

    setError(null);

    if (mode === "password" && password !== confirmPassword) {
      setError("Passwords do not match. Please try again.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result =
        mode === "password"
          ? await api.auth.register({
              mode: "password",
              fullName: fullName.trim(),
              identifier: identifier.trim(),
              password,
            })
          : await api.auth.register({
              mode: "otp",
              fullName: fullName.trim(),
              phone: phone.trim(),
              otp: otp.trim(),
            });

      completeAuthRedirect(result.redirectTo);
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
    <form onSubmit={handleSubmit} className="flex flex-col flex-1 max-w-lg">
      <h3 className="text-xl sm:text-[23px] font-bold text-ink tracking-tight">
        {signUp.title}
      </h3>
      <p className="text-[13.5px] text-muted mt-1.5 mb-7">{signUp.subtitle}</p>

      {error && (
        <p className="text-[13px] font-medium text-red mb-4" role="alert">
          {error}
        </p>
      )}

      <AuthField
        label={signUp.fullNameLabel}
        placeholder={signUp.fullNamePlaceholder}
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        autoComplete="name"
        required
      />

      <AuthModeToggle
        mode={mode}
        onChange={setMode}
        passwordLabel={signUp.modes.password.label}
        otpLabel={signUp.modes.otp.label}
      />

      {mode === "password" ? (
        <>
          <AuthField
            label={signUp.modes.password.identifierLabel}
            placeholder={signUp.modes.password.identifierPlaceholder}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            autoComplete="username"
            required
          />
          <AuthField
            label={signUp.modes.password.passwordLabel}
            type="password"
            placeholder={signUp.modes.password.passwordPlaceholder}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          <AuthField
            label={signUp.modes.password.confirmPasswordLabel}
            type="password"
            placeholder={signUp.modes.password.confirmPasswordPlaceholder}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </>
      ) : (
        <>
          <AuthField
            label={signUp.modes.otp.phoneLabel}
            type="tel"
            placeholder={signUp.modes.otp.phonePlaceholder}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            required
          />
          <AuthField
            label={signUp.modes.otp.otpLabel}
            placeholder={signUp.modes.otp.otpPlaceholder}
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            inputMode="numeric"
            maxLength={6}
            required
          />
        </>
      )}

      <div className="mt-auto flex flex-col gap-6 pt-8">
        <div className="flex justify-end">
          <AuthContinueButton
            type="submit"
            label={isSubmitting ? "Creating account…" : signUp.continueLabel}
            disabled={!canSubmit || isSubmitting}
            loading={isSubmitting}
          />
        </div>
        <p className="text-[13px] text-muted text-center sm:text-left">
          {signUp.signInPrompt}{" "}
          <Link href="/auth/login" className="font-semibold text-brand hover:underline">
            {signUp.signInLabel}
          </Link>
        </p>
      </div>
    </form>
  );
}
