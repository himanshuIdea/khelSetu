import type { PlatformRole } from "@/lib/rbac";

export type { PlatformRole };

export type SessionTokenPayload = {
  sub: string;
  email?: string;
  phone?: string;
  platformRole?: PlatformRole;
  mustChangePassword?: boolean;
};

export type AuthAcademy = {
  id: string;
  slug: string;
  role: string;
};

export type AuthProfile = {
  id: string;
  username: string | null;
  email: string | null;
  phone: string | null;
  fullName: string;
  platformRole: PlatformRole | null;
  phoneVerified: boolean;
  mustChangePassword: boolean;
  academies: AuthAcademy[];
  needsAcademyOnboarding: boolean;
};
