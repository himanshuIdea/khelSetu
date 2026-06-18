"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AcademyOnboardingRequestDetail } from "@/lib/academy-onboarding";
import { isEditableOnboardingStatus } from "@/lib/academy-onboarding";
import { OnboardingProfileForm } from "@/components/auth/OnboardingProfileForm";
import { OnboardingStatusPanel } from "@/components/auth/onboarding/OnboardingStatusPanel";
import { api, ApiError } from "@/lib/api";

export function OnboardingWorkspace() {
  const router = useRouter();
  const [request, setRequest] = useState<AcademyOnboardingRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRequest = useCallback(async () => {
    setError(null);
    try {
      const { request: loaded } = await api.onboarding.getRequest();
      setRequest(loaded);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load onboarding status.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequest();
  }, [loadRequest]);

  function handleRequestUpdated(next: AcademyOnboardingRequestDetail) {
    setRequest(next);
    if (next.status === "approved" && next.academyId) {
      router.replace(`/academy/${next.academyId}/dashboard`);
    }
  }

  if (loading) {
    return <div className="text-[13px] text-muted animate-pulse">Loading onboarding…</div>;
  }

  if (error) {
    return (
      <div className="rounded-[11px] border border-[#F6D4D4] bg-[#FEF2F2] px-4 py-3 text-[13px] text-red">
        {error}
      </div>
    );
  }

  const showForm = !request || isEditableOnboardingStatus(request.status);
  const showStatus =
    request &&
    (request.status === "submitted" ||
      request.status === "under_review" ||
      request.status === "needs_action" ||
      request.status === "rejected");

  return (
    <div className="space-y-6">
      {showStatus ? <OnboardingStatusPanel request={request} /> : null}
      {showForm ? (
        <OnboardingProfileForm initialRequest={request} onRequestUpdated={handleRequestUpdated} />
      ) : null}
    </div>
  );
}
