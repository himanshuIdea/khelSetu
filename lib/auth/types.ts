import type { PlatformRole } from "@/lib/rbac";

export type { PlatformRole };

export type SessionTokenPayload = {
  sub: string;
  email?: string;
  phone?: string;
  platformRole?: PlatformRole;
};

export type AuthAcademy = {
  id: string;
  slug: string;
  role: string;
};

export type AuthProfile = {
  id: string;
  email: string | null;
  phone: string | null;
  fullName: string;
  platformRole: PlatformRole | null;
  phoneVerified: boolean;
  academies: AuthAcademy[];
  needsAcademyOnboarding: boolean;
};
