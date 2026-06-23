import { AuthRequiredError, requireSessionUserId } from "@/lib/auth/server";
import { checkAcademyReadAccess } from "@/lib/auth/academy-access";
import {
  ACADEMY_READONLY_MESSAGE,
  isAcademyNurseryDeregistered,
} from "@/lib/repositories/state-nurseries";

export class AcademyAccessError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "AcademyAccessError";
  }
}

export async function requireAcademyAccess(
  academyId: string,
  options?: { writable?: boolean }
): Promise<void> {
  try {
    const userId = await requireSessionUserId();
    const denial = await checkAcademyReadAccess(userId, academyId, {
      stateAdminMessage: "State administrators cannot manage academy players.",
    });

    if (denial) {
      throw new AcademyAccessError(denial.error, denial.status);
    }

    if (options?.writable && (await isAcademyNurseryDeregistered(academyId))) {
      throw new AcademyAccessError(ACADEMY_READONLY_MESSAGE, 403);
    }
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      throw new AcademyAccessError(error.message, 401);
    }
    throw error;
  }
}
