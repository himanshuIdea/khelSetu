"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AuthField } from "@/components/auth/AuthField";
import { AuthButton, AuthContinueButton } from "@/components/auth/AuthButton";
import { BrandColourField } from "@/components/auth/onboarding/BrandColourField";
import { BrandedLinkField } from "@/components/auth/onboarding/BrandedLinkField";
import { DistrictField } from "@/components/auth/onboarding/DistrictField";
import { FundingField } from "@/components/auth/onboarding/FundingField";
import { OnboardingKycSection } from "@/components/auth/onboarding/OnboardingKycSection";
import { SportsField } from "@/components/auth/onboarding/SportsField";
import { useBrandedLinkAvailability } from "@/components/auth/onboarding/useBrandedLinkAvailability";
import type { AcademyOnboardingRequestDetail } from "@/lib/academy-onboarding";
import { validateOnboardingKyc } from "@/lib/academy-onboarding";
import { authConfig } from "@/lib/auth-config";
import {
  brandedLinkFromAcademyName,
  finalizeBrandedLink,
  formatBrandedLinkInput,
  validateBrandedLink,
} from "@/lib/branded-link";
import {
  clearOnboardingDraft,
  getDefaultDraft,
  loadOnboardingDraft,
  saveOnboardingDraft,
  type OnboardingDraft,
} from "@/lib/onboarding-draft";
import { api, ApiError } from "@/lib/api";
import { mapFundingType, validateOnboardingPayload } from "@/lib/onboarding";

type FundingOption = (typeof authConfig.onboarding.fields.funding.options)[number];

type OnboardingProfileFormProps = {
  initialRequest?: AcademyOnboardingRequestDetail | null;
  onRequestUpdated: (request: AcademyOnboardingRequestDetail) => void;
};

function fundingLabelFromType(type: "govt_aided" | "private"): FundingOption {
  return type === "private" ? "Private" : "Govt-aided";
}

function draftFromRequest(request: AcademyOnboardingRequestDetail | null | undefined): OnboardingDraft {
  const base = loadOnboardingDraft() ?? getDefaultDraft();
  if (!request) return base;

  return {
    academyName: request.academyName ?? base.academyName,
    district: request.district ?? base.district,
    subdomain: request.slug ?? base.subdomain,
    sports: request.sports.length > 0 ? request.sports : base.sports,
    funding: fundingLabelFromType(request.fundingType),
    brandColour: request.brandColor ?? base.brandColour,
    slugEdited: Boolean(request.slug),
  };
}

export function OnboardingProfileForm({
  initialRequest = null,
  onRequestUpdated,
}: OnboardingProfileFormProps) {
  const { onboarding } = authConfig;
  const { fields } = onboarding;

  const [draft, setDraft] = useState<OnboardingDraft>(() => draftFromRequest(initialRequest));
  const [aadharNumber, setAadharNumber] = useState(initialRequest?.aadharNumber ?? "");
  const [panNumber, setPanNumber] = useState(initialRequest?.panNumber ?? "");
  const [gstNumber, setGstNumber] = useState(initialRequest?.gstNumber ?? "");
  const [hasAadharDocument, setHasAadharDocument] = useState(
    initialRequest?.hasAadharDocument ?? false
  );
  const [hasPanDocument, setHasPanDocument] = useState(initialRequest?.hasPanDocument ?? false);
  const [hasGstDocument, setHasGstDocument] = useState(initialRequest?.hasGstDocument ?? false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({
    academyName: false,
    district: false,
    brandedLink: false,
  });

  const slugEdited = useRef(draft.slugEdited);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isNeedsAction = initialRequest?.status === "needs_action";
  const requiredActions = initialRequest?.requiredActions ?? [];

  const { academyName, district, subdomain, sports, funding, brandColour } = draft;
  const { status: slugStatus, formatError, availabilityMessage } =
    useBrandedLinkAvailability(subdomain);

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveOnboardingDraft({ ...draft, slugEdited: slugEdited.current });
    }, 250);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [draft]);

  function fieldDisabled(field: string) {
    if (!isNeedsAction) return false;
    if (requiredActions.length === 0) return false;
    return !requiredActions.includes(field);
  }

  function updateDraft(patch: Partial<OnboardingDraft>) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  function handleAcademyNameChange(value: string) {
    if (fieldDisabled("academy_name")) return;
    setTouched((prev) => ({ ...prev, academyName: true }));
    if (!slugEdited.current) {
      updateDraft({
        academyName: value,
        subdomain: brandedLinkFromAcademyName(value),
      });
      return;
    }
    updateDraft({ academyName: value });
  }

  function handleSubdomainChange(value: string) {
    if (fieldDisabled("slug")) return;
    slugEdited.current = true;
    setError(null);
    updateDraft({
      subdomain: formatBrandedLinkInput(value),
      slugEdited: true,
    });
  }

  function handleSubdomainBlur() {
    setTouched((prev) => ({ ...prev, brandedLink: true }));
    const finalized = finalizeBrandedLink(subdomain);
    if (finalized !== subdomain) {
      updateDraft({ subdomain: finalized });
    }
  }

  const brandedLinkValidation = useMemo(() => validateBrandedLink(subdomain), [subdomain]);

  const submitBlockedReason = useMemo(() => {
    if (isSubmitting) return null;
    if (!academyName.trim()) return "Enter your academy name.";
    if (!district.trim()) return "Select your district.";
    if (!subdomain.trim()) return "Choose a branded link.";
    if (!brandedLinkValidation.valid) {
      return brandedLinkValidation.message ?? "Fix the branded link to continue.";
    }
    if (slugStatus === "checking") return "Checking branded link availability…";
    if (slugStatus === "taken") return "This branded link is already taken — pick another.";
    if (slugStatus === "unavailable") {
      return availabilityMessage ?? "Could not verify branded link availability.";
    }
    if (slugStatus !== "available") return "Confirm your branded link is available.";
    if (sports.length === 0) return "Add at least one sport.";
    const kycError = validateOnboardingKyc({
      aadharNumber,
      panNumber,
      gstNumber,
      aadharDocumentKey: hasAadharDocument ? "set" : null,
      panDocumentKey: hasPanDocument ? "set" : null,
      gstDocumentKey: hasGstDocument ? "set" : null,
    });
    if (kycError) return kycError;
    return null;
  }, [
    academyName,
    district,
    subdomain,
    sports.length,
    slugStatus,
    isSubmitting,
    brandedLinkValidation,
    availabilityMessage,
    aadharNumber,
    panNumber,
    gstNumber,
    hasAadharDocument,
    hasPanDocument,
    hasGstDocument,
  ]);

  const canSubmit = submitBlockedReason === null;

  function buildPayload() {
    const finalizedSubdomain = finalizeBrandedLink(subdomain);
    return {
      academyName: academyName.trim(),
      district: district.trim(),
      slug: finalizedSubdomain,
      sports,
      fundingType: mapFundingType(funding),
      brandColor: brandColour,
      aadharNumber,
      panNumber,
      gstNumber,
    };
  }

  async function persistDraft() {
    const payload = buildPayload();
    const { request } = await api.onboarding.saveDraft(payload);
    onRequestUpdated(request);
    setHasAadharDocument(request.hasAadharDocument);
    setHasPanDocument(request.hasPanDocument);
    setHasGstDocument(request.hasGstDocument);
    return request;
  }

  async function handleUploadDocument(docType: "aadhar" | "pan" | "gst", file: File) {
    await persistDraft();
    const { request } = await api.onboarding.uploadDocument(docType, file);
    onRequestUpdated(request);
    setHasAadharDocument(request.hasAadharDocument);
    setHasPanDocument(request.hasPanDocument);
    setHasGstDocument(request.hasGstDocument);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setTouched({ academyName: true, district: true, brandedLink: true });

    const payload = buildPayload();
    const finalizedSubdomain = payload.slug;
    if (finalizedSubdomain !== subdomain) {
      updateDraft({ subdomain: finalizedSubdomain });
    }

    const validationError = validateOnboardingPayload(payload);
    if (validationError) {
      setError(validationError);
      return;
    }

    const kycError = validateOnboardingKyc({
      aadharNumber,
      panNumber,
      gstNumber,
      aadharDocumentKey: hasAadharDocument ? "set" : null,
      panDocumentKey: hasPanDocument ? "set" : null,
      gstDocumentKey: hasGstDocument ? "set" : null,
    });
    if (kycError) {
      setError(kycError);
      return;
    }

    if (slugStatus !== "available") {
      try {
        const check = await api.academy.checkSlug(finalizedSubdomain);
        if (!check.available) {
          setError(check.message ?? "This branded link is already taken. Pick another.");
          return;
        }
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("Cannot reach the API. Start the full stack with: pnpm dev");
        }
        return;
      }
    }

    setIsSubmitting(true);

    try {
      await api.onboarding.saveDraft(payload);
      const { request } = await api.onboarding.submit();
      clearOnboardingDraft();
      onRequestUpdated(request);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleBack() {
    clearOnboardingDraft();
    try {
      await api.auth.logout();
    } catch {
      // Continue to login even if logout fails.
    }
  }

  const showAcademyError = touched.academyName && !academyName.trim();
  const showDistrictError = touched.district && !district.trim();

  return (
    <form onSubmit={handleSubmit} className="flex flex-col flex-1 w-full max-w-2xl">
      <h3 className="text-xl sm:text-[23px] font-bold text-ink tracking-tight">
        {onboarding.title}
      </h3>
      <p className="text-[13.5px] text-muted mt-1.5 mb-7">{onboarding.subtitle}</p>

      {error && (
        <div
          className="mb-5 rounded-[11px] border border-[#F6D4D4] bg-[#FEF2F2] px-4 py-3 text-[13px] text-red"
          role="alert"
        >
          {error}
        </div>
      )}

      <AuthField
        label={fields.academyName.label}
        placeholder={fields.academyName.defaultValue}
        value={academyName}
        onChange={(e) => handleAcademyNameChange(e.target.value)}
        onBlur={() => setTouched((prev) => ({ ...prev, academyName: true }))}
        autoComplete="organization"
        required
        disabled={fieldDisabled("academy_name")}
        aria-invalid={showAcademyError}
      />
      {showAcademyError && (
        <p className="text-[11.5px] text-red -mt-3 mb-4">Academy name is required.</p>
      )}

      <div className="flex flex-col sm:flex-row gap-[18px] mb-5">
        <DistrictField
          label={fields.district.label}
          placeholder={fields.district.defaultValue}
          value={district}
          suggestions={fields.district.suggestions}
          onChange={(value) => {
            if (fieldDisabled("district")) return;
            setTouched((prev) => ({ ...prev, district: true }));
            updateDraft({ district: value });
          }}
        />
        <BrandedLinkField
          label={fields.brandedLink.label}
          placeholder={fields.brandedLink.defaultValue}
          suffix={fields.brandedLink.suffix}
          hint={fields.brandedLink.hint}
          value={subdomain}
          status={slugStatus}
          formatError={formatError}
          availabilityMessage={availabilityMessage}
          touched={touched.brandedLink}
          onChange={handleSubdomainChange}
          onBlur={handleSubdomainBlur}
        />
      </div>
      {showDistrictError && (
        <p className="text-[11.5px] text-red -mt-3 mb-4">District is required.</p>
      )}

      <SportsField
        label={fields.sports.label}
        addLabel={fields.sports.addLabel}
        sports={sports}
        suggestions={fields.sports.suggestions}
        onChange={(nextSports) => {
          if (fieldDisabled("sports")) return;
          updateDraft({ sports: nextSports });
        }}
      />

      <div className="flex flex-col sm:flex-row gap-[18px] mb-5">
        <FundingField
          label={fields.funding.label}
          options={fields.funding.options}
          value={funding as FundingOption}
          onChange={(value) => {
            if (fieldDisabled("funding_type")) return;
            updateDraft({ funding: value });
          }}
        />
        <BrandColourField
          label={fields.brandColour.label}
          colors={fields.brandColour.colors}
          value={brandColour}
          onChange={(value) => {
            if (fieldDisabled("brand_color")) return;
            updateDraft({ brandColour: value });
          }}
        />
      </div>

      <OnboardingKycSection
        aadharNumber={aadharNumber}
        panNumber={panNumber}
        gstNumber={gstNumber}
        hasAadharDocument={hasAadharDocument}
        hasPanDocument={hasPanDocument}
        hasGstDocument={hasGstDocument}
        fieldDisabled={fieldDisabled}
        onAadharNumberChange={setAadharNumber}
        onPanNumberChange={setPanNumber}
        onGstNumberChange={setGstNumber}
        onUploadDocument={handleUploadDocument}
      />

      <div className="mt-auto flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-8">
        <Link href="/auth/login" onClick={handleBack}>
          <AuthButton variant="ghost" type="button" className="w-full sm:w-auto">
            {onboarding.backLabel}
          </AuthButton>
        </Link>
        <div className="flex flex-col items-stretch sm:items-end gap-1.5">
          {submitBlockedReason && (
            <p className="text-[11.5px] text-muted text-center sm:text-right">{submitBlockedReason}</p>
          )}
          <AuthContinueButton
            label={isSubmitting ? "Submitting…" : "Submit for verification"}
            type="submit"
            loading={isSubmitting}
            disabled={!canSubmit}
            className="w-full sm:w-auto"
          />
        </div>
      </div>
    </form>
  );
}
