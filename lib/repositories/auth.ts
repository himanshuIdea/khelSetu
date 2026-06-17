import { eq } from "drizzle-orm";
import { academies, academyMemberships, users } from "@/db/schema";
import { verifyOtpChallenge } from "@/lib/auth/otp";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { normalizeUsername } from "@/lib/auth/username";
import type { AuthProfile } from "@/lib/auth/types";
import { db, isUniqueViolation } from "@/lib/db";
import { getInitials } from "@/lib/onboarding";
import { isStateAdmin } from "@/lib/rbac";

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

function toAuthProfile(
  user: DbUser,
  memberships: { academyId: string; slug: string; role: string }[]
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
  };
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

export async function getAuthProfile(userId: string): Promise<AuthProfile | null> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return null;

  const memberships = await getMembershipsForUser(userId);
  return toAuthProfile(user, memberships);
}

export async function registerWithPassword(input: {
  fullName: string;
  email: string;
  password: string;
}): Promise<AuthProfile> {
  const email = normalizeEmail(input.email);
  const passwordHash = await hashPassword(input.password);
  const fullName = input.fullName.trim();

  try {
    const [user] = await db
      .insert(users)
      .values({
        fullName,
        avatarInitials: getInitials(fullName),
        email,
        passwordHash,
        phoneVerified: false,
      })
      .returning();

    return toAuthProfile(user, []);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new DuplicateAccountError("An account with this email already exists.");
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

    return toAuthProfile(user, []);
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

async function findUserByIdentifier(identifier: string) {
  const trimmed = identifier.trim();
  if (!trimmed) return null;

  if (looksLikeEmail(trimmed)) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizeEmail(trimmed)))
      .limit(1);
    return user ?? null;
  }

  if (looksLikePhone(trimmed)) {
    const phone = normalizePhone(trimmed);
    const [user] = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
    return user ?? null;
  }

  const username = normalizeUsername(trimmed);
  const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return user ?? null;
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
  return toAuthProfile(user, memberships);
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
  return toAuthProfile(updated, memberships);
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
  return toAuthProfile(user, memberships);
}

export async function userHasAcademyMembership(userId: string): Promise<boolean> {
  const memberships = await getMembershipsForUser(userId);
  return memberships.length > 0;
}
