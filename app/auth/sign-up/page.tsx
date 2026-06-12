"use client";

import { AuthShell } from "@/components/auth/AuthShell";
import { UserSignUpForm } from "@/components/auth/UserSignUpForm";
import { authConfig } from "@/lib/auth-config";

export default function SignUpPage() {
  const { login, signUp } = authConfig;

  return (
    <AuthShell
      headline={login.headline}
      subcopy={login.subcopy}
      activeStep={signUp.activeStep}
      progressPercent={signUp.progressPercent}
    >
      <UserSignUpForm />
    </AuthShell>
  );
}
