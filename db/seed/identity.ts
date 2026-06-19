import { hashPassword } from "@/lib/auth/password";
import { getInitials } from "@/lib/onboarding";
import { PLATFORM_ROLES, type PlatformRole } from "@/lib/rbac";
import { users } from "@/db/schema";
import { db } from "@/lib/db/client";

export type SeedIdentityUser = {
  fullName: string;
  email: string;
  password: string;
  platformRole?: PlatformRole;
};

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

export function getStateAdminSeedUser(): SeedIdentityUser | null {
  const email = readEnv("STATE_ADMIN_EMAIL");
  const password = readEnv("STATE_ADMIN_PASSWORD");

  if (!email || !password) {
    console.warn(
      "Skipping state admin seed: set STATE_ADMIN_EMAIL and STATE_ADMIN_PASSWORD in .env"
    );
    return null;
  }

  const fullName = readEnv("STATE_ADMIN_FULL_NAME") ?? "State Administrator";

  return {
    email,
    password,
    fullName,
    platformRole: PLATFORM_ROLES.STATE_ADMIN,
  };
}

export function getAcademyAdminSeedUser(): SeedIdentityUser | null {
  const email = readEnv("SEED_ACADEMY_ADMIN_EMAIL");
  const password = readEnv("SEED_ACADEMY_ADMIN_PASSWORD");

  if (!email || !password) {
    console.warn(
      "Skipping academy admin seed credentials: set SEED_ACADEMY_ADMIN_EMAIL and SEED_ACADEMY_ADMIN_PASSWORD in .env"
    );
    return null;
  }

  const fullName = readEnv("SEED_ACADEMY_ADMIN_FULL_NAME") ?? "Academy Administrator";

  return { email, password, fullName };
}

async function upsertSeedUser(spec: SeedIdentityUser) {
  const passwordHash = await hashPassword(spec.password);

  await db
    .insert(users)
    .values({
      fullName: spec.fullName,
      avatarInitials: getInitials(spec.fullName),
      email: spec.email,
      passwordHash,
      platformRole: spec.platformRole ?? null,
      phoneVerified: false,
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        fullName: spec.fullName,
        avatarInitials: getInitials(spec.fullName),
        passwordHash,
        platformRole: spec.platformRole ?? null,
        updatedAt: new Date(),
      },
    });
}

export async function seedIdentityUsers() {
  const stateAdmin = getStateAdminSeedUser();
  if (stateAdmin) {
    await upsertSeedUser(stateAdmin);
    console.log(`Seeded state admin: ${stateAdmin.email}`);
  } else {
    throw new Error(
      "Bulk seed requires STATE_ADMIN_EMAIL and STATE_ADMIN_PASSWORD in .env."
    );
  }

  const academyAdmin = getAcademyAdminSeedUser();
  if (academyAdmin) {
    await upsertSeedUser(academyAdmin);
    console.log(`Seeded legacy academy admin: ${academyAdmin.email}`);
  }

  return { stateAdmin, academyAdmin };
}
