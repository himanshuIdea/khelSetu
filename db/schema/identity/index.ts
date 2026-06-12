import { boolean, pgEnum, pgSchema, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { primaryId, timestamps } from "../_shared";

export const identitySchema = pgSchema("identity");

export const membershipRoleEnum = pgEnum("membership_role", [
  "admin",
  "coach",
  "staff",
  "player",
]);

export const platformRoleEnum = pgEnum("platform_role", ["state_admin"]);

export const users = identitySchema.table(
  "users",
  {
    id: primaryId(),
    authUserId: uuid("auth_user_id"),
    email: text("email"),
    phone: text("phone"),
    passwordHash: text("password_hash"),
    phoneVerified: boolean("phone_verified").notNull().default(false),
    platformRole: platformRoleEnum("platform_role"),
    fullName: text("full_name").notNull(),
    avatarInitials: text("avatar_initials").notNull(),
    avatarColor: text("avatar_color"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("users_email_idx").on(table.email),
    uniqueIndex("users_phone_idx").on(table.phone),
  ]
);

export const academyMemberships = identitySchema.table(
  "academy_memberships",
  {
    id: primaryId(),
    userId: uuid("user_id").notNull(),
    academyId: uuid("academy_id").notNull(),
    role: membershipRoleEnum("role").notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("academy_memberships_user_academy_idx").on(table.userId, table.academyId)]
);
