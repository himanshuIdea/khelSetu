import { AuthRequiredError, requireSessionUserId } from "@/lib/auth/server";
import { MEMBERSHIP_ROLES } from "@/lib/rbac/membership-roles";
import { getAuthProfile } from "@/lib/repositories/auth";

export class AcademyAdminAccessError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "AcademyAdminAccessError";
  }
}

export async function requireAcademyAdminAccess(academyId: string) {
  try {
    const userId = await requireSessionUserId();
    const profile = await getAuthProfile(userId);

    if (!profile) {
      throw new AcademyAdminAccessError("User not found.", 404);
    }

    const isAdmin = profile.academies.some(
      (academy) => academy.id === academyId && academy.role === MEMBERSHIP_ROLES.ADMIN
    );

    if (!isAdmin) {
      throw new AcademyAdminAccessError(
        "Only academy administrators can manage credentials.",
        403
      );
    }

    return profile;
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      throw new AcademyAdminAccessError(error.message, 401);
    }
    throw error;
  }
}
