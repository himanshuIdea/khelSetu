export const PLATFORM_ROLES = {
  STATE_ADMIN: "state_admin",
} as const;

export type PlatformRole = (typeof PLATFORM_ROLES)[keyof typeof PLATFORM_ROLES];

export const PLATFORM_ROLE_LABELS: Record<PlatformRole, string> = {
  [PLATFORM_ROLES.STATE_ADMIN]: "State Administrator",
};
