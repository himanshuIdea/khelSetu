import { AuthRequiredError, requireSessionUserId } from "@/lib/auth/server";
import { isStateAdmin } from "@/lib/rbac";
import { getAuthProfile } from "@/lib/repositories/auth";

export class AcademyAccessError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "AcademyAccessError";
  }
}

export async function requireAcademyAccess(academyId: string) {
  try {
    const userId = await requireSessionUserId();
    const profile = await getAuthProfile(userId);

    if (!profile) {
      throw new AcademyAccessError("User not found.", 404);
    }

    if (isStateAdmin(profile.platformRole)) {
      throw new AcademyAccessError(
        "State administrators cannot manage academy players.",
        403
      );
    }

    const hasAccess = profile.academies.some((academy) => academy.id === academyId);
    if (!hasAccess) {
      throw new AcademyAccessError("You do not have access to this academy.", 403);
    }

    return profile;
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      throw new AcademyAccessError(error.message, 401);
    }
    throw error;
  }
}
