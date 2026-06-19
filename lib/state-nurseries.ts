export type NurseryVerificationStatus = "verified" | "pending" | "flagged";

export type NurseryFlagResponseStatus = "none" | "addressed" | "review_requested";

export type NurseryPillVariant = "green" | "amber" | "red";

export type StateNurseryFilters = {
  district?: string;
  sport?: string;
  status?: NurseryVerificationStatus | "all";
};

export type StateNurseryListItem = {
  academyId: string;
  name: string;
  initials: string;
  color: string;
  district: string;
  sportLabel: string;
  detail: string;
  athleteCount: number;
  status: NurseryPillVariant;
  statusLabel: string;
  verificationStatus: NurseryVerificationStatus;
};

export type StateNurserySearchResult = {
  academyId: string;
  name: string;
  initials: string;
  color: string;
  district: string;
  sportLabel: string;
  detail: string;
};

export type StateNurseryAdmin = {
  fullName: string;
  email: string | null;
  phone: string | null;
  avatarInitials: string;
};

export type StateNurseryDetail = {
  academyId: string;
  name: string;
  initials: string;
  color: string;
  district: string;
  locationLabel: string;
  sports: string[];
  sportLabel: string;
  athleteCount: number;
  verificationStatus: NurseryVerificationStatus;
  status: NurseryPillVariant;
  statusLabel: string;
  registeredAt: string;
  admin: StateNurseryAdmin | null;
  flagNote: string | null;
  flagGuidelines: string | null;
  flaggedAt: string | null;
  flagResponseStatus: NurseryFlagResponseStatus;
  flagResponseNote: string | null;
  flagResponseAt: string | null;
};

export type AcademyNurseryFlag = {
  academyId: string;
  flagNote: string;
  flagGuidelines: string;
  flaggedAt: string;
  flagResponseStatus: NurseryFlagResponseStatus;
  flagResponseNote: string | null;
  flagResponseAt: string | null;
};

export const FLAG_RESPONSE_LABELS: Record<
  Exclude<NurseryFlagResponseStatus, "none">,
  string
> = {
  addressed: "Marked as addressed",
  review_requested: "Review requested",
};

export function nurseryStatusToPill(status: NurseryVerificationStatus): {
  variant: NurseryPillVariant;
  label: string;
} {
  switch (status) {
    case "verified":
      return { variant: "green", label: "Verified" };
    case "pending":
      return { variant: "amber", label: "Pending" };
    case "flagged":
      return { variant: "red", label: "Flagged" };
  }
}

export function buildNurseryDetailLine(district: string, sportLabel: string) {
  return `${district} · ${sportLabel}`;
}
