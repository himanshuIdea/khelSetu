"use client";

import { AuthField } from "@/components/auth/AuthField";
import { OnboardingDocumentField } from "@/components/auth/onboarding/OnboardingDocumentField";
import {
  normalizeAadharNumber,
  normalizeGstNumber,
  normalizePanNumber,
} from "@/lib/academy-onboarding";

type OnboardingKycSectionProps = {
  aadharNumber: string;
  panNumber: string;
  gstNumber: string;
  hasAadharDocument: boolean;
  hasPanDocument: boolean;
  hasGstDocument: boolean;
  disabled?: boolean;
  fieldDisabled?: (field: string) => boolean;
  onAadharNumberChange: (value: string) => void;
  onPanNumberChange: (value: string) => void;
  onGstNumberChange: (value: string) => void;
  onUploadDocument: (docType: "aadhar" | "pan" | "gst", file: File) => Promise<void>;
};

export function OnboardingKycSection({
  aadharNumber,
  panNumber,
  gstNumber,
  hasAadharDocument,
  hasPanDocument,
  hasGstDocument,
  disabled = false,
  fieldDisabled,
  onAadharNumberChange,
  onPanNumberChange,
  onGstNumberChange,
  onUploadDocument,
}: OnboardingKycSectionProps) {
  const isDisabled = (field: string) => disabled || Boolean(fieldDisabled?.(field));

  return (
    <div className="mb-6 pt-2 border-t border-line">
      <h4 className="text-[15px] font-bold text-ink mb-1">Verification documents</h4>
      <p className="text-[12.5px] text-muted mb-5 leading-relaxed">
        Upload KYC documents for state verification. Your Aadhaar number is shared with state
        reviewers only.
      </p>

      <div className="space-y-5">
        <AuthField
          label="Aadhaar number"
          placeholder="12-digit Aadhaar number"
          value={aadharNumber}
          onChange={(e) => onAadharNumberChange(normalizeAadharNumber(e.target.value))}
          inputMode="numeric"
          autoComplete="off"
          required
          disabled={isDisabled("aadhar_number")}
          maxLength={12}
        />

        <OnboardingDocumentField
          label="Aadhaar card"
          fileName={hasAadharDocument ? "Aadhaar card on file" : null}
          disabled={isDisabled("aadhar_document")}
          onUpload={(file) => onUploadDocument("aadhar", file)}
        />

        <AuthField
          label="PAN number"
          placeholder="ABCDE1234F"
          value={panNumber}
          onChange={(e) => onPanNumberChange(normalizePanNumber(e.target.value))}
          autoComplete="off"
          required
          disabled={isDisabled("pan_number")}
          maxLength={10}
        />

        <OnboardingDocumentField
          label="PAN card"
          fileName={hasPanDocument ? "PAN card on file" : null}
          disabled={isDisabled("pan_document")}
          onUpload={(file) => onUploadDocument("pan", file)}
        />

        <AuthField
          label="GST number (academy)"
          placeholder="22AAAAA0000A1Z5"
          value={gstNumber}
          onChange={(e) => onGstNumberChange(normalizeGstNumber(e.target.value))}
          autoComplete="off"
          required
          disabled={isDisabled("gst_number")}
          maxLength={15}
        />

        <OnboardingDocumentField
          label="GST certificate"
          hint="GST registration certificate for the academy."
          fileName={hasGstDocument ? "GST certificate on file" : null}
          disabled={isDisabled("gst_document")}
          onUpload={(file) => onUploadDocument("gst", file)}
        />
      </div>
    </div>
  );
}
