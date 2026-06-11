import {
  brandedLinkFromAcademyName,
  isValidBrandedLink,
  validateBrandedLink,
} from "@/lib/branded-link";

export type OnboardingPayload = {
  academyName: string;
  district: string;
  slug: string;
  sports: string[];
  fundingType: "govt_aided" | "private";
  brandColor: string;
  adminName?: string;
  adminEmail?: string;
  adminPhone?: string;
};

export type OnboardingResult = {
  /** UUID used for `/academy/[id]` routes. */
  id: string;
  /** Branded subdomain stored in DB — not used for routing. */
  slug: string;
};

/** @deprecated Use brandedLinkFromAcademyName */
export function slugifyAcademyName(name: string): string {
  return brandedLinkFromAcademyName(name);
}

/** @deprecated Use isValidBrandedLink */
export function isValidSlug(slug: string): boolean {
  return isValidBrandedLink(slug);
}

export function mapFundingType(
  label: "Govt-aided" | "Private"
): "govt_aided" | "private" {
  return label === "Private" ? "private" : "govt_aided";
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "AC";
}

export function validateOnboardingPayload(payload: OnboardingPayload): string | null {
  if (!payload.academyName.trim()) return "Academy name is required.";
  if (!payload.district.trim()) return "District is required.";
  const brandedLink = validateBrandedLink(payload.slug);
  if (!brandedLink.valid) {
    return brandedLink.message ?? "Branded link is invalid.";
  }
  if (payload.sports.length === 0) return "Add at least one sport.";
  if (!payload.brandColor) return "Pick a brand colour.";
  return null;
}
