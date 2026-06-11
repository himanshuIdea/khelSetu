import { authConfig } from "@/lib/auth-config";

type FundingOption = (typeof authConfig.onboarding.fields.funding.options)[number];

export type OnboardingDraft = {
  academyName: string;
  district: string;
  subdomain: string;
  sports: string[];
  funding: FundingOption;
  brandColour: string;
  slugEdited: boolean;
};

const DRAFT_KEY = "khelsetu:onboarding-draft";

export function getDefaultDraft(): OnboardingDraft {
  const { fields } = authConfig.onboarding;
  return {
    academyName: "",
    district: "",
    subdomain: "",
    sports: [...fields.sports.defaultSports],
    funding: fields.funding.defaultValue,
    brandColour: fields.brandColour.defaultValue,
    slugEdited: false,
  };
}

export function loadOnboardingDraft(): OnboardingDraft | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(DRAFT_KEY);
  if (!raw) return null;
  try {
    return { ...getDefaultDraft(), ...(JSON.parse(raw) as Partial<OnboardingDraft>) };
  } catch {
    return null;
  }
}

export function saveOnboardingDraft(draft: OnboardingDraft) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function clearOnboardingDraft() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(DRAFT_KEY);
}
