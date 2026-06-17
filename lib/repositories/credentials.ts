import { and, eq, sql } from "drizzle-orm";
import {
  academyMemberships,
  batches,
  coaches,
  players,
  sports,
  staff,
  users,
} from "@/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { generateTemporaryPassword, generateUniqueUsername } from "@/lib/auth/username";
import { db, isUniqueViolation } from "@/lib/db";
import { getInitials } from "@/lib/onboarding";
import { MEMBERSHIP_ROLES, type MembershipRole } from "@/lib/rbac/membership-roles";

export type CredentialStatus = "none" | "pending_first_login" | "active";

export type CredentialRow = {
  personId: string;
  fullName: string;
  subtitle: string;
  username: string | null;
  credentialStatus: CredentialStatus;
  hasCredentials: boolean;
};

export type CredentialRoleSegment = "athletes" | "coaches" | "staff";

export type CredentialSummary = {
  athletes: { total: number; provisioned: number; pending: number };
  coaches: { total: number; provisioned: number; pending: number };
  staff: { total: number; provisioned: number; pending: number };
};

function mapCredentialStatus(
  userId: string | null | undefined,
  mustChangePassword: boolean | null | undefined
): CredentialStatus {
  if (!userId) return "none";
  if (mustChangePassword) return "pending_first_login";
  return "active";
}

function membershipRoleForSegment(segment: CredentialRoleSegment): MembershipRole {
  switch (segment) {
    case "athletes":
      return MEMBERSHIP_ROLES.PLAYER;
    case "coaches":
      return MEMBERSHIP_ROLES.COACH;
    case "staff":
      return MEMBERSHIP_ROLES.STAFF;
  }
}

export async function getCredentialSummary(academyId: string): Promise<CredentialSummary> {
  const [athletes, coachesList, staffList] = await Promise.all([
    listAthleteCredentials(academyId),
    listCoachCredentials(academyId),
    listStaffCredentials(academyId),
  ]);

  function summarize(rows: CredentialRow[]) {
    return {
      total: rows.length,
      provisioned: rows.filter((row) => row.hasCredentials).length,
      pending: rows.filter((row) => row.credentialStatus === "pending_first_login").length,
    };
  }

  return {
    athletes: summarize(athletes),
    coaches: summarize(coachesList),
    staff: summarize(staffList),
  };
}

export async function listAthleteCredentials(academyId: string): Promise<CredentialRow[]> {
  const rows = await db
    .select({
      personId: players.id,
      fullName: players.fullName,
      sportName: sports.name,
      batchName: batches.name,
      userId: players.userId,
      username: users.username,
      mustChangePassword: users.mustChangePassword,
    })
    .from(players)
    .innerJoin(sports, eq(players.sportId, sports.id))
    .leftJoin(batches, eq(players.batchId, batches.id))
    .leftJoin(users, eq(players.userId, users.id))
    .where(and(eq(players.academyId, academyId), eq(players.status, "active")))
    .orderBy(players.fullName);

  return rows.map((row) => ({
    personId: row.personId,
    fullName: row.fullName,
    subtitle: [row.sportName, row.batchName].filter(Boolean).join(" · "),
    username: row.username,
    credentialStatus: mapCredentialStatus(row.userId, row.mustChangePassword),
    hasCredentials: Boolean(row.userId),
  }));
}

export async function listCoachCredentials(academyId: string): Promise<CredentialRow[]> {
  const rows = await db
    .select({
      personId: coaches.id,
      fullName: coaches.fullName,
      sportName: sports.name,
      roleTitle: coaches.roleTitle,
      userId: coaches.userId,
      username: users.username,
      mustChangePassword: users.mustChangePassword,
    })
    .from(coaches)
    .innerJoin(sports, eq(coaches.sportId, sports.id))
    .leftJoin(users, eq(coaches.userId, users.id))
    .where(eq(coaches.academyId, academyId))
    .orderBy(coaches.fullName);

  return rows.map((row) => ({
    personId: row.personId,
    fullName: row.fullName,
    subtitle: `${row.sportName} · ${row.roleTitle}`,
    username: row.username,
    credentialStatus: mapCredentialStatus(row.userId, row.mustChangePassword),
    hasCredentials: Boolean(row.userId),
  }));
}

export async function listStaffCredentials(academyId: string): Promise<CredentialRow[]> {
  const rows = await db
    .select({
      personId: staff.id,
      fullName: staff.fullName,
      roleTitle: staff.roleTitle,
      userId: staff.userId,
      username: users.username,
      mustChangePassword: users.mustChangePassword,
    })
    .from(staff)
    .leftJoin(users, eq(staff.userId, users.id))
    .where(
      and(
        eq(staff.academyId, academyId),
        sql`not exists (select 1 from ${coaches} where ${coaches.staffId} = ${staff.id} and ${coaches.academyId} = ${academyId})`
      )
    )
    .orderBy(staff.fullName);

  return rows.map((row) => ({
    personId: row.personId,
    fullName: row.fullName,
    subtitle: row.roleTitle,
    username: row.username,
    credentialStatus: mapCredentialStatus(row.userId, row.mustChangePassword),
    hasCredentials: Boolean(row.userId),
  }));
}

export class CredentialError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CredentialError";
  }
}

type PersonRecord = {
  id: string;
  fullName: string;
  userId: string | null;
  avatarColor: string;
};

async function getAthletePerson(academyId: string, personId: string): Promise<PersonRecord | null> {
  const [row] = await db
    .select({
      id: players.id,
      fullName: players.fullName,
      userId: players.userId,
      avatarColor: players.avatarColor,
    })
    .from(players)
    .where(and(eq(players.id, personId), eq(players.academyId, academyId)))
    .limit(1);
  return row ?? null;
}

async function getCoachPerson(academyId: string, personId: string): Promise<PersonRecord | null> {
  const [row] = await db
    .select({
      id: coaches.id,
      fullName: coaches.fullName,
      userId: coaches.userId,
      avatarColor: coaches.avatarColor,
    })
    .from(coaches)
    .where(and(eq(coaches.id, personId), eq(coaches.academyId, academyId)))
    .limit(1);
  return row ?? null;
}

async function getStaffPerson(academyId: string, personId: string): Promise<PersonRecord | null> {
  const [row] = await db
    .select({
      id: staff.id,
      fullName: staff.fullName,
      userId: staff.userId,
      avatarColor: staff.avatarColor,
    })
    .from(staff)
    .where(and(eq(staff.id, personId), eq(staff.academyId, academyId)))
    .limit(1);
  return row ?? null;
}

async function getPersonForSegment(
  academyId: string,
  segment: CredentialRoleSegment,
  personId: string
): Promise<PersonRecord | null> {
  switch (segment) {
    case "athletes":
      return getAthletePerson(academyId, personId);
    case "coaches":
      return getCoachPerson(academyId, personId);
    case "staff":
      return getStaffPerson(academyId, personId);
  }
}

export async function provisionCredentials(
  academyId: string,
  segment: CredentialRoleSegment,
  personId: string
): Promise<{ username: string; temporaryPassword: string }> {
  const person = await getPersonForSegment(academyId, segment, personId);
  if (!person) {
    throw new CredentialError("Person not found in this academy.");
  }
  if (person.userId) {
    throw new CredentialError("Credentials already exist for this person.");
  }

  const username = await generateUniqueUsername(person.fullName);
  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);
  const membershipRole = membershipRoleForSegment(segment);

  try {
    await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          fullName: person.fullName,
          avatarInitials: getInitials(person.fullName),
          avatarColor: person.avatarColor,
          username,
          passwordHash,
          mustChangePassword: true,
        })
        .returning();

      await tx.insert(academyMemberships).values({
        userId: user.id,
        academyId,
        role: membershipRole,
      });

      switch (segment) {
        case "athletes":
          await tx
            .update(players)
            .set({ userId: user.id, updatedAt: new Date() })
            .where(eq(players.id, personId));
          break;
        case "coaches":
          await tx
            .update(coaches)
            .set({ userId: user.id, updatedAt: new Date() })
            .where(eq(coaches.id, personId));
          break;
        case "staff":
          await tx
            .update(staff)
            .set({ userId: user.id, updatedAt: new Date() })
            .where(eq(staff.id, personId));
          break;
      }
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new CredentialError("Could not create credentials. Please try again.");
    }
    throw error;
  }

  return { username, temporaryPassword };
}

export async function reissueTemporaryPassword(
  academyId: string,
  segment: CredentialRoleSegment,
  personId: string
): Promise<{ username: string; temporaryPassword: string }> {
  const person = await getPersonForSegment(academyId, segment, personId);
  if (!person?.userId) {
    throw new CredentialError("No credentials exist for this person.");
  }

  const [user] = await db.select().from(users).where(eq(users.id, person.userId)).limit(1);
  if (!user?.username) {
    throw new CredentialError("User account not found.");
  }

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);

  await db
    .update(users)
    .set({
      passwordHash,
      mustChangePassword: true,
      updatedAt: new Date(),
    })
    .where(eq(users.id, person.userId));

  return { username: user.username, temporaryPassword };
}

export async function listCredentialsBySegment(
  academyId: string,
  segment: CredentialRoleSegment
): Promise<CredentialRow[]> {
  switch (segment) {
    case "athletes":
      return listAthleteCredentials(academyId);
    case "coaches":
      return listCoachCredentials(academyId);
    case "staff":
      return listStaffCredentials(academyId);
  }
}
