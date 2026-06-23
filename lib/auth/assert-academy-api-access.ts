import { NextResponse } from "next/server";
import { checkAcademyReadAccess } from "@/lib/auth/academy-access";
import { AuthRequiredError, requireSessionUserId } from "@/lib/auth/server";
import {
  ACADEMY_READONLY_MESSAGE,
  isAcademyNurseryDeregistered,
} from "@/lib/repositories/state-nurseries";

type AssertAcademyApiAccessOptions = {
  stateAdminMessage?: string;
  writable?: boolean;
};

/**
 * Lightweight academy API guard — avoids full `getAuthProfile` on every request.
 * Returns `{ userId }` on success or a `NextResponse` error.
 */
export async function assertAcademyApiAccess(
  academyId: string,
  options?: AssertAcademyApiAccessOptions
): Promise<NextResponse | { userId: string }> {
  try {
    const userId = await requireSessionUserId();
    const denial = await checkAcademyReadAccess(userId, academyId, {
      stateAdminMessage: options?.stateAdminMessage,
    });

    if (denial) {
      return NextResponse.json({ error: denial.error }, { status: denial.status });
    }

    if (options?.writable && (await isAcademyNurseryDeregistered(academyId))) {
      return NextResponse.json({ error: ACADEMY_READONLY_MESSAGE }, { status: 403 });
    }

    return { userId };
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    throw error;
  }
}

export async function assertAcademyWritable(
  academyId: string,
  options?: Omit<AssertAcademyApiAccessOptions, "writable">
): Promise<NextResponse | { userId: string }> {
  return assertAcademyApiAccess(academyId, { ...options, writable: true });
}

export function handleAcademyApiAccessError(error: unknown, fallbackMessage: string) {
  if (error instanceof AuthRequiredError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  const message = error instanceof Error ? error.message : fallbackMessage;
  return NextResponse.json({ error: message }, { status: 500 });
}
