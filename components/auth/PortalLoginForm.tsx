"use client";

import { FormEvent, useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthField } from "@/components/auth/AuthField";
import { AuthModeToggle } from "@/components/auth/AuthModeToggle";
import { AuthContinueButton } from "@/components/auth/AuthButton";
import { PortalLoginCrossLinks } from "@/components/auth/PortalLoginCrossLinks";
import { authConfig, type AuthMode, type CuratedPortalId } from "@/lib/auth-config";
import type { PortalKind } from "@/lib/auth/portal-login";
import { portalLoginAction, type PortalLoginState } from "@/lib/auth/portal-login-action";
import { getPortalBrandHref } from "@/lib/portal-landing-config";

type PortalLoginFormProps = {
  portal: PortalKind;
};

function curatedPortalId(portal: PortalKind): CuratedPortalId | null {
  if (portal === "admin") return "admin";
  if (portal === "state") return "state";
  if (portal === "coach") return "coach";
  if (portal === "player") return "player";
  return null;
}

export function PortalLoginForm({ portal }: PortalLoginFormProps) {
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const [loginState, submitLogin, isSubmitting] = useActionState<PortalLoginState, FormData>(
    portalLoginAction,
    {}
  );

  const copy = useMemo(() => {
    if (portal === "admin") {
      return authConfig.login;
    }
    if (portal === "state") {
      return authConfig.portalLogin.state;
    }
    return authConfig.portalLogin[portal];
  }, [portal]);

  const sidePanel = copy.sidePanel;
  const crossLinkPortal = curatedPortalId(portal);

  const passwordOnly = portal === "player";
  const [mode, setMode] = useState<AuthMode>("password");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  const canSubmit =
    mode === "password"
      ? identifier.trim() !== "" && password.trim() !== ""
      : phone.trim() !== "" && otp.trim() !== "";

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    if (!canSubmit || isSubmitting) {
      e.preventDefault();
    }
  }

  const signUpHref =
    portal === "admin"
      ? "/auth/sign-up"
      : "signUpHref" in copy
        ? copy.signUpHref
        : "/auth/login";

  const brandHref = crossLinkPortal ? getPortalBrandHref(crossLinkPortal) : undefined;

  return (
    <AuthShell
      headline={copy.headline}
      subcopy={copy.subcopy}
      activeStep={sidePanel.activeStep}
      progressPercent={sidePanel.progressPercent}
      steps={sidePanel.steps}
      showProgress={sidePanel.showProgress}
      brandHref={brandHref}
    >
      <form
        action={submitLogin}
        onSubmit={handleSubmit}
        className="flex flex-col flex-1 max-w-lg min-w-0"
      >
        <input type="hidden" name="portal" value={portal} />
        <input type="hidden" name="mode" value={mode} />
        {next ? <input type="hidden" name="next" value={next} /> : null}

        <h3 className="text-xl sm:text-[23px] font-bold text-ink tracking-tight">
          {copy.title}
        </h3>
        <p className="text-[13.5px] text-muted mt-1.5 mb-7">{copy.subtitle}</p>

        {loginState.error && (
          <p className="text-[13px] font-medium text-red mb-4" role="alert">
            {loginState.error}
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
              name="identifier"
              label={copy.modes.password.identifierLabel}
              placeholder={copy.modes.password.identifierPlaceholder}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
            />
            <AuthField
              name="password"
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
                name="phone"
                label={copy.modes.otp.phoneLabel}
                type="tel"
                placeholder={copy.modes.otp.phonePlaceholder}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
              />
              <AuthField
                name="otp"
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

        <div className="mt-auto flex flex-col gap-6 pt-8 min-w-0">
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
          {portal === "admin" && "staffSignInPrompt" in copy && (
            <p className="text-[13px] text-muted text-center sm:text-left">
              {copy.staffSignInPrompt}{" "}
              <Link
                href={copy.staffSignInHref}
                className="font-semibold text-brand hover:underline"
              >
                {copy.staffSignInLabel}
              </Link>
            </p>
          )}
          {crossLinkPortal ? <PortalLoginCrossLinks current={crossLinkPortal} /> : null}
        </div>
      </form>
    </AuthShell>
  );
}
