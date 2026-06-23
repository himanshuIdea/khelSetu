import { and, eq, inArray, isNotNull } from "drizzle-orm";
import { academies, academyMemberships, users } from "@/db/schema";
import { verifyOtpChallenge } from "@/lib/auth/otp";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { normalizeUsername } from "@/lib/auth/username";
import type { AuthProfile } from "@/lib/auth/types";
import { db, isUniqueViolation } from "@/lib/db";
import { getInitials } from "@/lib/onboarding";
import { isStateAdmin } from "@/lib/rbac";
import { MEMBERSHIP_ROLES } from "@/lib/rbac/membership-roles";
import { getOnboardingRequestByUserId } from "@/lib/repositories/academy-onboarding";

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export class DuplicateAccountError extends AuthError {
  constructor(message = "An account with these details already exists.") {
    super(message);
    this.name = "DuplicateAccountError";
  }
}

export class InvalidCredentialsError extends AuthError {
  constructor(message = "Invalid credentials.") {
    super(message);
    this.name = "InvalidCredentialsError";
  }
}

type DbUser = typeof users.$inferSelect;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string) {
  return phone.trim();
}

async function resolveProfileOnboarding(
  userId: string,
  platformRole: DbUser["platformRole"],
  memberships: { academyId: string; role: string }[]
): Promise<{
  onboardingRequest: AuthProfile["onboardingRequest"];
  requiresNurseryReregistration: boolean;
}> {
  const requiresNurseryReregistration = await userRequiresNurseryReregistration(memberships);
  const shouldLoadOnboarding =
    (memberships.length === 0 && !isStateAdmin(platformRole)) || requiresNurseryReregistration;

  if (!shouldLoadOnboarding) {
    return { onboardingRequest: null, requiresNurseryReregistration };
  }

  const detail = await getOnboardingRequestByUserId(userId);
  if (!detail) {
    return { onboardingRequest: null, requiresNurseryReregistration };
  }

  return {
    requiresNurseryReregistration,
    onboardingRequest: {
      id: detail.id,
      status: detail.status,
      requestType: detail.requestType,
      requiredActions: detail.requiredActions,
      reviewNotes: detail.reviewNotes,
      submittedAt: detail.submittedAt,
      reviewedAt: detail.reviewedAt,
      academyId: detail.academyId,
    },
  };
}

function toAuthProfile(
  user: DbUser,
  memberships: { academyId: string; slug: string; role: string }[],
  onboardingRequest: AuthProfile["onboardingRequest"],
  requiresNurseryReregistration: boolean
): AuthProfile {
  const academiesList = memberships.map((membership) => ({
    id: membership.academyId,
    slug: membership.slug,
    role: membership.role,
  }));

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    phone: user.phone,
    fullName: user.fullName,
    platformRole: user.platformRole,
    phoneVerified: user.phoneVerified,
    mustChangePassword: user.mustChangePassword,
    academies: academiesList,
    needsAcademyOnboarding: !isStateAdmin(user.platformRole) && academiesList.length === 0,
    requiresNurseryReregistration,
    onboardingRequest,
  };
}

async function userRequiresNurseryReregistration(
  memberships: { academyId: string; role: string }[]
): Promise<boolean> {
  const adminAcademyIds = memberships
    .filter((membership) => membership.role === MEMBERSHIP_ROLES.ADMIN)
    .map((membership) => membership.academyId);

  if (adminAcademyIds.length === 0) return false;

  const [row] = await db
    .select({ id: academies.id })
    .from(academies)
    .where(
      and(inArray(academies.id, adminAcademyIds), isNotNull(academies.nurseryDeregisteredAt))
    )
    .limit(1);

  return Boolean(row);
}

async function getMembershipsForUser(userId: string) {
  return db
    .select({
      academyId: academyMemberships.academyId,
      slug: academies.slug,
      role: academyMemberships.role,
    })
    .from(academyMemberships)
    .innerJoin(academies, eq(academyMemberships.academyId, academies.id))
    .where(eq(academyMemberships.userId, userId));
}

const PROFILE_CACHE_TTL_MS = 15_000;
const profileCache = new Map<string, { profile: AuthProfile | null; expires: number }>();

async function fetchAuthProfile(userId: string): Promise<AuthProfile | null> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return null;

  const memberships = await getMembershipsForUser(userId);
  const { onboardingRequest, requiresNurseryReregistration } = await resolveProfileOnboarding(
    userId,
    user.platformRole,
    memberships
  );

  return toAuthProfile(user, memberships, onboardingRequest, requiresNurseryReregistration);
}

export async function getAuthProfile(userId: string): Promise<AuthProfile | null> {
  const cached = profileCache.get(userId);
  if (cached && cached.expires > Date.now()) {
    return cached.profile;
  }

  const profile = await fetchAuthProfile(userId);
  profileCache.set(userId, { profile, expires: Date.now() + PROFILE_CACHE_TTL_MS });
  return profile;
}

export async function registerWithPassword(input: {
  fullName: string;
  email: string;
  password: string;
}): Promise<AuthProfile> {
  return registerWithIdentifier({
    fullName: input.fullName,
    identifier: input.email,
    password: input.password,
  });
}

export async function registerWithIdentifier(input: {
  fullName: string;
  identifier: string;
  password: string;
}): Promise<AuthProfile> {
  const trimmedIdentifier = input.identifier.trim();
  const password = input.password.trim();
  if (!trimmedIdentifier) {
    throw new AuthError("Username, email, or phone is required.");
  }
  if (password.length < 8) {
    throw new AuthError("Password must be at least 8 characters.");
  }

  const fields = resolveIdentifierFields(trimmedIdentifier);
  const passwordHash = await hashPassword(password);
  const fullName = input.fullName.trim();

  const values: {
    fullName: string;
    avatarInitials: string;
    passwordHash: string;
    phoneVerified: boolean;
    email?: string;
    phone?: string;
    username?: string;
  } = {
    fullName,
    avatarInitials: getInitials(fullName),
    passwordHash,
    phoneVerified: false,
  };

  if (fields.kind === "email" && fields.email) {
    values.email = fields.email;
  } else if (fields.kind === "phone" && fields.phone) {
    values.phone = fields.phone;
  } else if (fields.username) {
    values.username = fields.username;
  }

  try {
    const [user] = await db.insert(users).values(values).returning();
    return toAuthProfile(user, [], null, false);
  } catch (error) {
    if (isUniqueViolation(error)) {
      if (fields.kind === "email") {
        throw new DuplicateAccountError("An account with this email already exists.");
      }
      if (fields.kind === "phone") {
        throw new DuplicateAccountError("An account with this phone number already exists.");
      }
      throw new DuplicateAccountError("This username is already taken.");
    }
    throw error;
  }
}

export async function registerWithPhone(input: {
  fullName: string;
  phone: string;
  otp: string;
}): Promise<AuthProfile> {
  const phone = normalizePhone(input.phone);
  const otpValid = await verifyOtpChallenge(phone, input.otp);
  if (!otpValid) {
    throw new InvalidCredentialsError("Invalid OTP.");
  }

  const fullName = input.fullName.trim();

  try {
    const [user] = await db
      .insert(users)
      .values({
        fullName,
        avatarInitials: getInitials(fullName),
        phone,
        phoneVerified: false,
      })
      .returning();

    return toAuthProfile(user, [], null, false);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new DuplicateAccountError("An account with this phone number already exists.");
    }
    throw error;
  }
}

function looksLikeEmail(value: string) {
  return value.includes("@");
}

function looksLikePhone(value: string) {
  return /^\+?\d[\d\s-]{7,}$/.test(value.trim());
}

type IdentifierKind = "email" | "phone" | "username";

function classifyIdentifier(value: string): IdentifierKind {
  const trimmed = value.trim();
  if (looksLikeEmail(trimmed)) return "email";
  if (looksLikePhone(trimmed)) return "phone";
  return "username";
}

function parseIdentifierFields(identifier: string): {
  kind: IdentifierKind;
  email: string | null;
  phone: string | null;
  username: string | null;
  legacyEmailLookup: string;
} {
  const trimmed = identifier.trim();
  const kind = classifyIdentifier(trimmed);

  if (kind === "email") {
    return {
      kind,
      email: normalizeEmail(trimmed),
      phone: null,
      username: null,
      legacyEmailLookup: normalizeEmail(trimmed),
    };
  }

  if (kind === "phone") {
    return {
      kind,
      email: null,
      phone: normalizePhone(trimmed),
      username: null,
      legacyEmailLookup: normalizeEmail(trimmed),
    };
  }

  return {
    kind,
    email: null,
    phone: null,
    username: normalizeUsername(trimmed),
    legacyEmailLookup: normalizeEmail(trimmed),
  };
}

function resolveIdentifierFields(identifier: string): {
  kind: IdentifierKind;
  email: string | null;
  phone: string | null;
  username: string | null;
  legacyEmailLookup: string;
} {
  const fields = parseIdentifierFields(identifier);
  if (fields.kind === "username" && fields.username) {
    if (fields.username.length < 3 || fields.username.length > 32) {
      throw new AuthError("Username must be between 3 and 32 characters.");
    }
  }
  return fields;
}

async function findUserByEmail(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return user ?? null;
}

async function findUserByPhone(phone: string) {
  const [user] = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  return user ?? null;
}

async function findUserByUsername(username: string) {
  const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return user ?? null;
}

async function findUserByIdentifier(identifier: string) {
  const trimmed = identifier.trim();
  if (!trimmed) return null;

  const fields = parseIdentifierFields(trimmed);

  if (fields.kind === "email" && fields.email) {
    const user = await findUserByEmail(fields.email);
    if (user) return user;
  }

  if (fields.kind === "phone" && fields.phone) {
    const user = await findUserByPhone(fields.phone);
    if (user) return user;
  }

  if (fields.kind === "username" && fields.username) {
    const user = await findUserByUsername(fields.username);
    if (user) return user;
  }

  // Legacy sign-ups stored every identifier in `email`; keep login working for those rows.
  if (fields.legacyEmailLookup) {
    const legacyUser = await findUserByEmail(fields.legacyEmailLookup);
    if (legacyUser) return legacyUser;
  }

  return null;
}

async function authenticatePasswordUser(user: DbUser, password: string): Promise<AuthProfile> {
  if (!user.passwordHash) {
    throw new InvalidCredentialsError();
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    throw new InvalidCredentialsError();
  }

  const memberships = await getMembershipsForUser(user.id);
  const { onboardingRequest, requiresNurseryReregistration } = await resolveProfileOnboarding(
    user.id,
    user.platformRole,
    memberships
  );
  return toAuthProfile(user, memberships, onboardingRequest, requiresNurseryReregistration);
}

export async function loginWithPassword(input: {
  email: string;
  password: string;
}): Promise<AuthProfile> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizeEmail(input.email)))
    .limit(1);

  if (!user) {
    throw new InvalidCredentialsError();
  }

  return authenticatePasswordUser(user, input.password);
}

export async function loginWithIdentifier(input: {
  identifier: string;
  password: string;
}): Promise<AuthProfile> {
  const user = await findUserByIdentifier(input.identifier);
  if (!user) {
    throw new InvalidCredentialsError();
  }

  return authenticatePasswordUser(user, input.password);
}

export async function changePassword(input: {
  userId: string;
  currentPassword: string;
  newPassword: string;
}): Promise<AuthProfile> {
  const newPassword = input.newPassword.trim();
  if (newPassword.length < 8) {
    throw new AuthError("New password must be at least 8 characters.");
  }

  const [user] = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
  if (!user?.passwordHash) {
    throw new InvalidCredentialsError();
  }

  const valid = await verifyPassword(input.currentPassword, user.passwordHash);
  if (!valid) {
    throw new InvalidCredentialsError("Current password is incorrect.");
  }

  const passwordHash = await hashPassword(newPassword);

  const [updated] = await db
    .update(users)
    .set({
      passwordHash,
      mustChangePassword: false,
      passwordChangedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, input.userId))
    .returning();

  const memberships = await getMembershipsForUser(updated.id);
  const { onboardingRequest, requiresNurseryReregistration } = await resolveProfileOnboarding(
    updated.id,
    updated.platformRole,
    memberships
  );
  return toAuthProfile(updated, memberships, onboardingRequest, requiresNurseryReregistration);
}

export async function loginWithPhone(input: {
  phone: string;
  otp: string;
}): Promise<AuthProfile> {
  const phone = normalizePhone(input.phone);
  const otpValid = await verifyOtpChallenge(phone, input.otp);
  if (!otpValid) {
    throw new InvalidCredentialsError("Invalid OTP.");
  }

  const [user] = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  if (!user) {
    throw new InvalidCredentialsError("No account found with this phone number.");
  }

  const memberships = await getMembershipsForUser(user.id);
  const { onboardingRequest, requiresNurseryReregistration } = await resolveProfileOnboarding(
    user.id,
    user.platformRole,
    memberships
  );
  return toAuthProfile(user, memberships, onboardingRequest, requiresNurseryReregistration);
}

export async function userHasAcademyMembership(userId: string): Promise<boolean> {
  const memberships = await getMembershipsForUser(userId);
  return memberships.length > 0;
}
