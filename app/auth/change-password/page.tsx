"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthField } from "@/components/auth/AuthField";
import { AuthContinueButton } from "@/components/auth/AuthButton";
import { authConfig } from "@/lib/auth-config";
import { api, ApiError } from "@/lib/api";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { changePassword: copy } = authConfig;
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    api.auth
      .me()
      .then((session) => {
        if (!session.user.mustChangePassword) {
          router.replace(session.redirectTo);
          return;
        }
        setCheckingSession(false);
      })
      .catch(() => {
        router.replace("/auth/login");
      });
  }, [router]);

  const canSubmit =
    currentPassword.trim() !== "" &&
    newPassword.trim().length >= 8 &&
    newPassword === confirmPassword;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit || isSubmitting) return;

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const result = await api.auth.changePassword({
        currentPassword,
        newPassword,
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

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface text-muted text-sm">
        Loading…
      </div>
    );
  }

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

        <AuthField
          label={copy.currentPasswordLabel}
          type="password"
          placeholder={copy.currentPasswordPlaceholder}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
        />
        <AuthField
          label={copy.newPasswordLabel}
          type="password"
          placeholder={copy.newPasswordPlaceholder}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
        />
        <AuthField
          label={copy.confirmPasswordLabel}
          type="password"
          placeholder={copy.confirmPasswordPlaceholder}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
        />

        <div className="mt-auto flex justify-end pt-8">
          <AuthContinueButton
            type="submit"
            label={isSubmitting ? "Saving…" : copy.continueLabel}
            disabled={!canSubmit || isSubmitting}
            loading={isSubmitting}
          />
        </div>
      </form>
    </AuthShell>
  );
}
