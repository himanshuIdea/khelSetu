export type CreateCoachPayload = {
  fullName: string;
  sportId: string;
  roleTitle?: string;
  nisLevel?: "nis_level_1" | "nis_level_2" | "in_review";
};

export type CoachFormOptions = {
  sports: { id: string; name: string }[];
};

export function validateCreateCoachPayload(payload: CreateCoachPayload): string | null {
  if (!payload.fullName.trim()) return "Coach name is required.";
  if (!payload.sportId.trim()) return "Sport is required.";
  return null;
}
