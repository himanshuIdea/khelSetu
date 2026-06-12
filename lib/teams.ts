export type CreateTeamPayload = {
  name: string;
  sportId: string;
  coachId?: string;
  weightClass?: string;
};

export type TeamFormOptions = {
  sports: { id: string; name: string; color: string }[];
  coaches: { id: string; name: string; sportId: string }[];
};

export type TeamMemberFormOptions = {
  players: { id: string; name: string; weight: string; batch: string; avatarColor: string }[];
};

export type AddTeamMembersPayload = {
  playerIds: string[];
};

export type TeamMemberSelectionStatus = "selected" | "standby" | "not_selected";
export type TeamMemberRole = "captain" | "member";

export type UpdateTeamMemberPayload = {
  selectionStatus?: TeamMemberSelectionStatus;
  role?: TeamMemberRole;
};

/** @deprecated Use UpdateTeamMemberPayload */
export type UpdateTeamMemberSelectionPayload = {
  selectionStatus: TeamMemberSelectionStatus;
};

const SELECTION_STATUSES: TeamMemberSelectionStatus[] = ["selected", "standby", "not_selected"];
const TEAM_MEMBER_ROLES: TeamMemberRole[] = ["captain", "member"];

export function validateCreateTeamPayload(payload: CreateTeamPayload): string | null {
  if (!payload.name.trim()) return "Team name is required.";
  if (!payload.sportId.trim()) return "Sport is required.";
  return null;
}

export function validateAddTeamMembersPayload(payload: AddTeamMembersPayload): string | null {
  if (!Array.isArray(payload.playerIds) || payload.playerIds.length === 0) {
    return "Select at least one player.";
  }
  if (payload.playerIds.some((id) => typeof id !== "string" || !id.trim())) {
    return "Invalid player selection.";
  }
  return null;
}

export function validateUpdateTeamMemberPayload(payload: UpdateTeamMemberPayload): string | null {
  const hasSelection = payload.selectionStatus !== undefined;
  const hasRole = payload.role !== undefined;

  if (!hasSelection && !hasRole) {
    return "No fields to update.";
  }

  if (hasSelection && !SELECTION_STATUSES.includes(payload.selectionStatus!)) {
    return "Invalid selection status.";
  }

  if (hasRole && !TEAM_MEMBER_ROLES.includes(payload.role!)) {
    return "Invalid role.";
  }

  return null;
}

export function validateUpdateTeamMemberSelectionPayload(
  payload: UpdateTeamMemberSelectionPayload
): string | null {
  return validateUpdateTeamMemberPayload(payload);
}
