import { randomInt } from "node:crypto";
import { eq } from "drizzle-orm";
import { users } from "@/db/schema";
import { db } from "@/lib/db";

export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase();
}

function lettersOnly(name: string): string {
  return name.replace(/[^a-zA-Z]/g, "").toLowerCase();
}

function nameParts(fullName: string): string[] {
  return fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => lettersOnly(part))
    .filter(Boolean);
}

async function isUsernameTaken(username: string): Promise<boolean> {
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  return Boolean(row);
}

function buildUsernameCandidates(fullName: string): string[] {
  const parts = nameParts(fullName);
  if (parts.length === 0) return ["user"];

  const first = parts[0] ?? "user";
  const last = parts[parts.length - 1] ?? first;
  const base = parts.join("");
  const candidates: string[] = [base];

  for (let i = 2; i <= 99; i++) {
    candidates.push(`${base}${i}`);
  }

  if (parts.length >= 2) {
    candidates.push(`${first}.${last}`);
    candidates.push(`${first[0]}${last}`);
    candidates.push(`${first}${last[0]}`);
    for (let i = 2; i <= 9; i++) {
      candidates.push(`${first}.s${i}`);
      candidates.push(`${first}${i}`);
    }
  }

  return [...new Set(candidates)].filter((c) => c.length >= 3 && c.length <= 32);
}

export async function generateUniqueUsername(fullName: string): Promise<string> {
  const candidates = buildUsernameCandidates(fullName);

  for (const candidate of candidates) {
    if (!(await isUsernameTaken(candidate))) {
      return candidate;
    }
  }

  const fallbackBase = lettersOnly(fullName) || "user";
  for (let i = 100; i <= 9999; i++) {
    const candidate = `${fallbackBase}${i}`.slice(0, 32);
    if (!(await isUsernameTaken(candidate))) {
      return candidate;
    }
  }

  throw new Error("Unable to generate a unique username.");
}

export function generateTemporaryPassword(): string {
  return String(randomInt(10_000_000, 100_000_000));
}
