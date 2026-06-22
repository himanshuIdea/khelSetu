import type { AcademyBatchName } from "@/lib/batches";
import { ACADEMY_BATCH_NAMES, getBatchLabel } from "@/lib/batches";

export const PARTICIPATION_SCOPES = ["intra_academy", "inter_academy"] as const;
export type ParticipationScope = (typeof PARTICIPATION_SCOPES)[number];

export const COMPETITION_FORMATS = [
  "knockout",
  "double_elimination",
  "round_robin",
  "pool_knockout",
  "heats",
  "trial",
] as const;
export type CompetitionFormat = (typeof COMPETITION_FORMATS)[number];

export const AGE_DIVISIONS = ["sub_junior", "junior", "senior"] as const;
export type AgeDivision = (typeof AGE_DIVISIONS)[number];

const BATCH_NAME_BY_DIVISION: Record<AgeDivision, AcademyBatchName> = {
  sub_junior: "Sub-junior",
  junior: "Junior",
  senior: "Senior",
};

export function ageDivisionToBatchName(division: AgeDivision): AcademyBatchName {
  return BATCH_NAME_BY_DIVISION[division];
}

export const PARTICIPATION_SCOPE_OPTIONS = [
  { value: "intra_academy" as const, label: "Intra-academy" },
  { value: "inter_academy" as const, label: "Inter-academy" },
];

export const COMPETITION_FORMAT_OPTIONS: { value: CompetitionFormat; label: string }[] = [
  { value: "knockout", label: "Knockout" },
  { value: "double_elimination", label: "Double elimination" },
  { value: "round_robin", label: "Round robin" },
  { value: "pool_knockout", label: "Pool then knockout" },
  { value: "heats", label: "Heats / time trial" },
  { value: "trial", label: "Trial / merit list" },
];

export const AGE_DIVISION_OPTIONS = AGE_DIVISIONS.map((value) => ({
  value,
  label: getBatchLabel(BATCH_NAME_BY_DIVISION[value]),
}));

/** Sports where weight class is required for tournament entry. */
export const WEIGHT_CLASS_SPORTS = new Set([
  "wrestling",
  "boxing",
  "judo",
  "weightlifting",
  "taekwondo",
]);

/** Alias used in plan/docs for combat-sport weight gating. */
export const WEIGHT_SPORTS = WEIGHT_CLASS_SPORTS;

export function sportRequiresWeightClass(sportName: string): boolean {
  return WEIGHT_CLASS_SPORTS.has(sportName.trim().toLowerCase());
}
export function normalizeWeightKg(value: string | null | undefined): string | null {
  if (value == null) return null;
  const digits = value.replace(/[^\d.]/g, "");
  if (!digits) return null;
  const n = Number.parseFloat(digits);
  if (!Number.isFinite(n)) return null;
  return String(Math.round(n));
}

export function weightsMatch(playerWeight: string | null | undefined, target: string): boolean {
  const a = normalizeWeightKg(playerWeight);
  const b = normalizeWeightKg(target);
  if (!b) return true;
  if (!a) return false;
  return a === b;
}

export type TournamentParticipantInput = {
  playerId: string;
  academyId: string;
};

export type CreateTournamentPayload = {
  name: string;
  location: string;
  startDate: string;
  endDate: string;
  participationScope: ParticipationScope;
  competitionFormat: CompetitionFormat;
  ageDivision: AgeDivision;
  sportId: string;
  weightClass?: string | null;
  description?: string | null;
  participantIds: TournamentParticipantInput[];
};

export type EligibleTournamentPlayer = {
  id: string;
  academyId: string;
  academyName: string;
  initials: string;
  name: string;
  sport: string;
  batch: string;
  weight: string;
  rating: string;
  attendance: string;
  avatarColor: string;
};

/** @alias EligibleTournamentPlayer */
export type EligiblePlayerRow = EligibleTournamentPlayer;

export type InterAcademyOption = {
  academyId: string;
  name: string;
  district: string;
  initials: string;
};

export type TournamentStandingRow = {
  id: string;
  poolId: string;
  poolName: string;
  playerId: string;
  playerName: string;
  academyName: string;
  played: number;
  won: number;
  lost: number;
  points: number;
  rank: number | null;
  resultValue: string | null;
  rating: string | null;
};

export type TournamentParticipantRow = {
  playerId: string;
  playerName: string;
  academyId: string;
  academyName: string;
  seedOrder: number | null;
  rating: string | null;
  batch: string;
  weight: string;
};

export type UpdateTournamentMatchPayload = {
  playerAId?: string | null;
  playerBId?: string | null;
  playerAName?: string | null;
  playerBName?: string | null;
  scoreA?: number | null;
  scoreB?: number | null;
  winnerPlayerId?: string | null;
  winnerSide?: "a" | "b" | null;
  status?: "scheduled" | "live" | "completed";
  advanceWinner?: boolean;
  scheduledAt?: string | null;
  matLabel?: string | null;
  matchLabel?: string | null;
};

export type UpdateTournamentMedalsPayload = {
  gold: number;
  silver: number;
  bronze: number;
};

export type TournamentScheduleMatch = {
  id: string;
  matchLabel: string;
  round: string;
  bracketPosition: number;
  matLabel: string | null;
  scheduledAt: string | null;
  status: "scheduled" | "live" | "completed";
  playerAName: string | null;
  playerBName: string | null;
  playerAId: string | null;
  playerBId: string | null;
  winnerPlayerId: string | null;
  scoreA: number | null;
  scoreB: number | null;
  heatNumber: number | null;
  laneNumber: number | null;
  poolId: string | null;
  groupLabel: string | null;
  boutSummary: string;
};

export function competitionFormatLabel(format: CompetitionFormat): string {
  return COMPETITION_FORMAT_OPTIONS.find((o) => o.value === format)?.label ?? format;
}

export function participationScopeLabel(scope: ParticipationScope): string {
  return PARTICIPATION_SCOPE_OPTIONS.find((o) => o.value === scope)?.label ?? scope;
}

export { ACADEMY_BATCH_NAMES };
