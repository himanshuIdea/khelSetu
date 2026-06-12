"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { OnboardingProfileForm } from "@/components/auth/OnboardingProfileForm";
import { OnboardingSkeleton } from "@/components/auth/onboarding/OnboardingSkeleton";
import { authConfig } from "@/lib/auth-config";
import { api, ApiError } from "@/lib/api";
import { isStateAdmin, STATE_ROUTE_PREFIX } from "@/lib/rbac";

export default function AcademyOnboardingPage() {
  const router = useRouter();
  const { login, onboarding } = authConfig;
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const session = await api.auth.me();

        if (cancelled) return;

        if (isStateAdmin(session.user.platformRole)) {
          router.replace(STATE_ROUTE_PREFIX);
          return;
        }

        if (!session.needsAcademyOnboarding && session.academies.length > 0) {
          router.replace(`/academy/${session.academies[0].id}/dashboard`);
          return;
        }

        setIsReady(true);
      } catch (error) {
        if (cancelled) return;

        if (error instanceof ApiError && error.status === 401) {
          router.replace("/auth/login");
          return;
        }

        router.replace("/auth/login");
      }
    }

    checkSession();

    return () => {
      cancelled = true;
    };
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
