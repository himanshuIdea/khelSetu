import { AuthRequiredError, requireSessionUserId } from "@/lib/auth/server";
import { checkAcademyReadAccess } from "@/lib/auth/academy-access";

export class AcademyAccessError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "AcademyAccessError";
  }
}

export async function requireAcademyAccess(academyId: string): Promise<void> {
  try {
    const userId = await requireSessionUserId();
    const denial = await checkAcademyReadAccess(userId, academyId, {
      stateAdminMessage: "State administrators cannot manage academy players.",
    });

    if (denial) {
      throw new AcademyAccessError(denial.error, denial.status);
    }
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      throw new AcademyAccessError(error.message, 401);
    }
    throw error;
  }
}
