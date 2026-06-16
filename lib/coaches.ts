export type NisLevel = "nis_level_1" | "nis_level_2" | "in_review";

export type AssignCoachPayload = {
  coachId: string;
  sportId: string;
  nisLevel: NisLevel;
  batchIds: string[];
};

export type UpdateCoachAssignmentPayload = {
  sportId: string;
  nisLevel: NisLevel;
  batchIds: string[];
};

export type UnassignScope = "sport" | "batch" | "all";

export type UnassignPayload = {
  scope: UnassignScope;
  sportId?: string;
  batchId?: string;
};

export type CoachAssignmentBatch = {
  id: string;
  name: string;
  isPrimary: boolean;
};

export type CoachAssignmentGroup = {
  sportId: string;
  sportName: string;
  nisLevel: NisLevel;
  batches: CoachAssignmentBatch[];
};

export type AffectedPlayer = {
  id: string;
  externalId: string;
  fullName: string;
  batchName: string;
  sportName: string;
};

export type BatchPrimaryPromotion = {
  batchId: string;
  batchName: string;
  promotedCoachId: string;
  promotedCoachName: string;
};

export type UnassignPreview = {
  players: AffectedPlayer[];
  promotions: BatchPrimaryPromotion[];
};

export type AssignCoachFormOptions = {
  sports: { id: string; name: string }[];
  batches: { id: string; name: string; sportId: string }[];
  coaches: {
    id: string;
    fullName: string;
    sportId: string;
    nisLevel: "nis_level_1" | "nis_level_2" | "in_review";
    staffId: string;
  }[];
};

export function validateAssignCoachPayload(payload: AssignCoachPayload): string | null {
  if (!payload.coachId?.trim()) return "Coach is required.";
  if (!payload.sportId?.trim()) return "Sport is required.";
  if (
    payload.nisLevel !== "nis_level_1" &&
    payload.nisLevel !== "nis_level_2" &&
    payload.nisLevel !== "in_review"
  ) {
    return "NIS certification is required.";
  }
  if (!Array.isArray(payload.batchIds) || payload.batchIds.length === 0) {
    return "Select at least one batch.";
  }
  for (const batchId of payload.batchIds) {
    if (typeof batchId !== "string" || !batchId) {
      return "Invalid batch selection.";
    }
  }
  return null;
}

function isValidNisLevel(value: unknown): value is NisLevel {
  return value === "nis_level_1" || value === "nis_level_2" || value === "in_review";
}

export function validateUpdateCoachAssignmentPayload(
  payload: UpdateCoachAssignmentPayload
): string | null {
  if (!payload.sportId?.trim()) return "Sport is required.";
  if (!isValidNisLevel(payload.nisLevel)) return "NIS certification is required.";
  if (!Array.isArray(payload.batchIds) || payload.batchIds.length === 0) {
    return "Select at least one batch.";
  }
  for (const batchId of payload.batchIds) {
    if (typeof batchId !== "string" || !batchId) {
      return "Invalid batch selection.";
    }
  }
  return null;
}

export function validateUnassignPayload(payload: UnassignPayload): string | null {
  if (payload.scope !== "sport" && payload.scope !== "batch" && payload.scope !== "all") {
    return "Invalid unassign scope.";
  }
  if (payload.scope === "sport" && !payload.sportId?.trim()) {
    return "Sport is required for this action.";
  }
  if (payload.scope === "batch" && !payload.batchId?.trim()) {
    return "Batch is required for this action.";
  }
  return null;
}
