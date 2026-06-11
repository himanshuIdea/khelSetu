"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { OnboardingProfileForm } from "@/components/auth/OnboardingProfileForm";
import { OnboardingSkeleton } from "@/components/auth/onboarding/OnboardingSkeleton";
import { authConfig } from "@/lib/auth-config";
import { getOnboardingSession } from "@/lib/auth-session";

export default function OnboardingPage() {
  const router = useRouter();
  const { login, onboarding } = authConfig;
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!getOnboardingSession()) {
      router.replace("/auth/login");
      return;
    }
    setIsReady(true);
  }, [router]);

  return (
    <AuthShell
      headline={login.headline}
      subcopy={login.subcopy}
      activeStep={onboarding.activeStep}
      progressPercent={onboarding.progressPercent}
    >
      {isReady ? <OnboardingProfileForm /> : <OnboardingSkeleton />}
    </AuthShell>
  );
}
