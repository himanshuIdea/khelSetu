"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthField } from "@/components/auth/AuthField";
import { AuthModeToggle } from "@/components/auth/AuthModeToggle";
import { AuthContinueButton } from "@/components/auth/AuthButton";
import { authConfig, type AuthMode } from "@/lib/auth-config";
import type { PortalKind } from "@/lib/auth/portal-login";
import { api, ApiError } from "@/lib/api";

type PortalLoginFormProps = {
  portal: PortalKind;
};

export function PortalLoginForm({ portal }: PortalLoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  const copy = useMemo(() => {
    if (portal === "admin") {
      return authConfig.login;
    }
    return authConfig.portalLogin[portal];
  }, [portal]);

  const passwordOnly = portal === "player";
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
              identifier: identifier.trim(),
              password,
              portal,
              next: next ?? undefined,
            })
          : await api.auth.login({
              mode: "otp",
              phone: phone.trim(),
              otp: otp.trim(),
              portal,
              next: next ?? undefined,
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

  const signUpHref =
    portal === "admin"
      ? "/auth/sign-up"
      : "signUpHref" in copy
        ? copy.signUpHref
        : "/auth/login";

  return (
    <AuthShell
      headline={copy.headline}
      subcopy={copy.subcopy}
      activeStep={copy.activeStep}
      progressPercent={copy.progressPercent}
    >
      <form onSubmit={handleSubmit} className="flex flex-col flex-1 max-w-lg">
        <h3 className="text-xl sm:text-[23px] font-bold text-ink tracking-tight">
          {copy.title}
        </h3>
        <p className="text-[13.5px] text-muted mt-1.5 mb-7">{copy.subtitle}</p>

        {error && (
          <p className="text-[13px] font-medium text-red mb-4" role="alert">
            {error}
          </p>
        )}

        {!passwordOnly && "otp" in copy.modes && (
          <AuthModeToggle
            mode={mode}
            onChange={setMode}
            passwordLabel={copy.modes.password.label}
            otpLabel={copy.modes.otp.label}
          />
        )}

        {mode === "password" ? (
          <>
            <AuthField
              label={copy.modes.password.identifierLabel}
              placeholder={copy.modes.password.identifierPlaceholder}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
            />
            <AuthField
              label={copy.modes.password.passwordLabel}
              type="password"
              placeholder={copy.modes.password.passwordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            {"forgotPasswordLabel" in copy.modes.password && (
              <button
                type="button"
                className="text-[13px] font-medium text-brand -mt-2 mb-4 text-left hover:underline"
              >
                {copy.modes.password.forgotPasswordLabel}
              </button>
            )}
          </>
        ) : (
          "otp" in copy.modes && (
            <>
              <AuthField
                label={copy.modes.otp.phoneLabel}
                type="tel"
                placeholder={copy.modes.otp.phonePlaceholder}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
              />
              <AuthField
                label={copy.modes.otp.otpLabel}
                placeholder={copy.modes.otp.otpPlaceholder}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                inputMode="numeric"
                maxLength={6}
              />
            </>
          )
        )}

        <div className="mt-auto flex flex-col gap-6 pt-8">
          <div className="flex justify-end">
            <AuthContinueButton
              type="submit"
              label={isSubmitting ? "Signing in…" : copy.continueLabel}
              disabled={!canSubmit || isSubmitting}
              loading={isSubmitting}
            />
          </div>
          {"signUpPrompt" in copy && (
            <p className="text-[13px] text-muted text-center sm:text-left">
              {copy.signUpPrompt}{" "}
              <Link href={signUpHref} className="font-semibold text-brand hover:underline">
                {copy.signUpLabel}
              </Link>
            </p>
          )}
        </div>
      </form>
    </AuthShell>
  );
}
