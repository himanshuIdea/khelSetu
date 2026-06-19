import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { eq, like } from "drizzle-orm";
import { academyMemberships, users } from "@/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { db } from "@/lib/db/client";
import { getInitials } from "@/lib/onboarding";
import type { AcademySeedSpec } from "./distributions";

export type AdminCredentialRow = {
  academyId: string;
  slug: string;
  name: string;
  district: string;
  adminEmail: string;
  password: string;
};

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

export function getBulkAdminPassword(): string {
  const password = readEnv("BULK_ADMIN_PASSWORD");
  if (!password) {
    throw new Error("BULK_ADMIN_PASSWORD is required in .env for bulk academy seed.");
  }
  return password;
}

export function getBulkAdminEmailDomain(): string {
  return readEnv("BULK_ADMIN_EMAIL_DOMAIN") ?? "haryana-sports.in";
}

export function adminEmailForSlug(slug: string): string {
  return `admin-${slug}@${getBulkAdminEmailDomain()}`;
}

export async function migrateLegacyAdminEmails(): Promise<number> {
  const domain = getBulkAdminEmailDomain();

  const legacyUsers = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(like(users.email, `admin+%@${domain}`));

  let migrated = 0;
  for (const user of legacyUsers) {
    const newEmail = user.email.replace("admin+", "admin-");
    await db
      .update(users)
      .set({ email: newEmail, updatedAt: new Date() })
      .where(eq(users.id, user.id));
    migrated += 1;
  }

  return migrated;
}

export async function seedAcademyAdmin(
  spec: AcademySeedSpec,
  academyId: string,
  passwordHash: string
): Promise<AdminCredentialRow> {
  const email = adminEmailForSlug(spec.slug);
  const password = getBulkAdminPassword();

  const [user] = await db
    .insert(users)
    .values({
      fullName: `${spec.name} Admin`,
      avatarInitials: getInitials(spec.name),
      email,
      passwordHash,
      mustChangePassword: false,
      phoneVerified: false,
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        fullName: `${spec.name} Admin`,
        avatarInitials: getInitials(spec.name),
        passwordHash,
        updatedAt: new Date(),
      },
    })
    .returning();

  await db
    .insert(academyMemberships)
    .values({ userId: user.id, academyId, role: "admin" })
    .onConflictDoNothing();

  return {
    academyId,
    slug: spec.slug,
    name: spec.name,
    district: spec.district,
    adminEmail: email,
    password,
  };
}

export async function seedAllAcademyAdmins(
  specs: AcademySeedSpec[],
  academyIds: Map<string, string>
): Promise<AdminCredentialRow[]> {
  const migrated = await migrateLegacyAdminEmails();
  if (migrated > 0) {
    console.log(`  migrated legacy admin emails: ${migrated}`);
  }

  const password = getBulkAdminPassword();
  const passwordHash = await hashPassword(password);
  const rows: AdminCredentialRow[] = [];

  for (const spec of specs) {
    const academyId = academyIds.get(spec.slug);
    if (!academyId) continue;
    rows.push(await seedAcademyAdmin(spec, academyId, passwordHash));
  }

  return rows;
}

export async function writeAdminCredentialsCsv(rows: AdminCredentialRow[]): Promise<string> {
  const outputDir = path.join(process.cwd(), "db/seed/output");
  await mkdir(outputDir, { recursive: true });
  const filePath = path.join(outputDir, "academy-admins.csv");

  const header = "academy_id,slug,name,district,admin_email,password";
  const lines = rows.map(
    (r) =>
      `${r.academyId},${r.slug},"${r.name.replace(/"/g, '""')}",${r.district},${r.adminEmail},${r.password}`
  );

  await writeFile(filePath, [header, ...lines].join("\n") + "\n", "utf8");
  return filePath;
}

export async function getStateAdminUserId(): Promise<string> {
  const email = readEnv("STATE_ADMIN_EMAIL");
  if (!email) {
    throw new Error("STATE_ADMIN_EMAIL is required for nursery registration during bulk seed.");
  }

  const [admin] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (!admin) {
    throw new Error(`State admin user not found for ${email}. Run seedIdentityUsers first.`);
  }
  return admin.id;
}
