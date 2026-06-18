"use client";

import type { AcademyOnboardingRequestSummary } from "@/lib/academy-onboarding";
import { ONBOARDING_STATUS_LABELS } from "@/lib/academy-onboarding";
import { Pill } from "@/components/academy/shared";

const ACTION_LABELS: Record<string, string> = {
  academy_name: "Update academy name",
  district: "Update district",
  slug: "Update branded link",
  sports: "Update sports offered",
  funding_type: "Update funding type",
  brand_color: "Update brand colour",
  aadhar_number: "Update Aadhaar number",
  aadhar_document: "Re-upload Aadhaar card",
  pan_number: "Update PAN number",
  pan_document: "Re-upload PAN card",
  gst_number: "Update GST number",
  gst_document: "Re-upload GST certificate",
};

function statusPillVariant(
  status: AcademyOnboardingRequestSummary["status"]
): "green" | "amber" | "red" | "grey" {
  if (status === "approved") return "green";
  if (status === "submitted" || status === "under_review") return "amber";
  if (status === "needs_action" || status === "rejected") return "red";
  return "grey";
}

type OnboardingStatusPanelProps = {
  request: AcademyOnboardingRequestSummary;
};

export function OnboardingStatusPanel({ request }: OnboardingStatusPanelProps) {
  const actions = request.requiredActions.map(
    (action) => ACTION_LABELS[action] ?? action.replaceAll("_", " ")
  );

  return (
    <div className="rounded-2xl border border-line bg-card p-5 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-lg font-bold text-ink">Verification status</h3>
        <Pill variant={statusPillVariant(request.status)}>
          {ONBOARDING_STATUS_LABELS[request.status]}
        </Pill>
      </div>

      {request.submittedAt ? (
        <p className="text-[13px] text-muted">
          Submitted {new Date(request.submittedAt).toLocaleString("en-IN")}
          {request.requestType === "resubmission" ? " · Resubmission" : ""}
        </p>
      ) : null}

      {request.status === "submitted" || request.status === "under_review" ? (
        <p className="text-[13.5px] text-text leading-relaxed">
          Your academy onboarding request is with the state team. You will get access to your
          dashboard after verification is complete.
        </p>
      ) : null}

      {request.status === "rejected" ? (
        <p className="text-[13.5px] text-red leading-relaxed">
          This request was rejected. Contact the state sports department if you need help starting
          again.
        </p>
      ) : null}

      {request.reviewNotes ? (
        <div className="rounded-xl border border-line bg-surface px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted mb-1">
            Review notes
          </div>
          <p className="text-[13px] text-ink leading-relaxed">{request.reviewNotes}</p>
        </div>
      ) : null}

      {request.status === "needs_action" && actions.length > 0 ? (
        <div>
          <div className="text-[12px] font-semibold text-ink mb-2">Actions required</div>
          <ul className="space-y-2">
            {actions.map((action) => (
              <li
                key={action}
                className="text-[13px] text-text flex items-start gap-2 before:content-['•'] before:text-brand"
              >
                {action}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
