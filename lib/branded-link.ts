export const BRANDED_LINK_MIN = 3;
export const BRANDED_LINK_MAX = 40;

const BRANDED_LINK_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const RESERVED_BRANDED_LINKS = new Set([
  "www",
  "api",
  "app",
  "admin",
  "auth",
  "login",
  "logout",
  "signup",
  "register",
  "onboarding",
  "dashboard",
  "support",
  "help",
  "status",
  "mail",
  "email",
  "cdn",
  "static",
  "assets",
  "docs",
  "blog",
  "dev",
  "staging",
  "test",
  "null",
  "undefined",
  "khelsetu",
  "academy",
  "academies",
]);

export type BrandedLinkValidation = {
  valid: boolean;
  message: string | null;
};

/** Live input formatting — lowercase, allowed chars only, no leading/trailing hyphen trim while typing. */
export function formatBrandedLinkInput(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, BRANDED_LINK_MAX);
}

/** Final cleanup on blur before validation / availability check. */
export function finalizeBrandedLink(raw: string): string {
  return formatBrandedLinkInput(raw).replace(/^-+|-+$/g, "");
}

export function validateBrandedLink(value: string): BrandedLinkValidation {
  const slug = value.trim();

  if (!slug) {
    return { valid: false, message: "Branded link is required." };
  }

  if (slug.length < BRANDED_LINK_MIN) {
    return {
      valid: false,
      message: `Use at least ${BRANDED_LINK_MIN} characters (e.g. dsa-academy).`,
    };
  }

  if (slug.length > BRANDED_LINK_MAX) {
    return {
      valid: false,
      message: `Use at most ${BRANDED_LINK_MAX} characters.`,
    };
  }

  if (slug.startsWith("-")) {
    return { valid: false, message: "Cannot start with a hyphen." };
  }

  if (slug.endsWith("-")) {
    return { valid: false, message: "Cannot end with a hyphen." };
  }

  if (!BRANDED_LINK_PATTERN.test(slug)) {
    return {
      valid: false,
      message: "Only lowercase letters, numbers, and single hyphens between words.",
    };
  }

  if (RESERVED_BRANDED_LINKS.has(slug)) {
    return { valid: false, message: "This name is reserved. Choose another." };
  }

  return { valid: true, message: null };
}

export function isValidBrandedLink(value: string): boolean {
  return validateBrandedLink(value).valid;
}

/** Derive a branded link suggestion from an academy name. */
export function brandedLinkFromAcademyName(name: string): string {
  const raw = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");

  return finalizeBrandedLink(raw);
}
