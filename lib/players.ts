import { sortBatchNames } from "@/lib/batches";

export type CreatePlayerPayload = {
  fullName: string;
  sportId: string;
  batchId: string;
  weightCategory?: string;
  heightCategory?: string;
  dateOfBirth?: string;
  monthlyFeePaise?: number;
  primaryCoachId?: string;
  status?: "active" | "on_hold";
};

export type UpdatePlayerPayload = CreatePlayerPayload;

export type PlayerEditData = UpdatePlayerPayload & {
  externalId: string;
};

export type PlayerFormOptions = {
  sports: { id: string; name: string; color: string }[];
  batches: { id: string; name: string; sportId: string }[];
  coaches: { id: string; name: string; sportId: string }[];
};

export type PlayerSportFilter = "all" | string;
export type PlayerBatchFilter = "all" | string;
export type PlayerFeesFilter = "all" | "paid" | "due" | "partial";
export type PlayerStatusFilter = "all" | "active" | "on_hold";

export type PlayerFilters = {
  sport: PlayerSportFilter;
  batch: PlayerBatchFilter;
  fees: PlayerFeesFilter;
  status: PlayerStatusFilter;
};

export const DEFAULT_PLAYER_FILTERS: PlayerFilters = {
  sport: "all",
  batch: "all",
  fees: "all",
  status: "all",
};

type FilterablePlayer = {
  sport: string;
  batch: string;
  feesVariant: "green" | "red" | "amber" | "grey";
  status: string;
};

export function filterPlayers<T extends FilterablePlayer>(
  players: T[],
  filters: PlayerFilters
): T[] {
  return players.filter((player) => {
    if (filters.sport !== "all" && player.sport !== filters.sport) return false;
    if (filters.batch !== "all" && player.batch !== filters.batch) return false;

    if (filters.fees !== "all") {
      const feeMap: Record<PlayerFeesFilter, FilterablePlayer["feesVariant"] | null> = {
        all: null,
        paid: "green",
        due: "red",
        partial: "amber",
      };
      if (player.feesVariant !== feeMap[filters.fees]) return false;
    }

    if (filters.status !== "all") {
      const statusLabel = filters.status === "on_hold" ? "On hold" : "Active";
      if (player.status !== statusLabel) return false;
    }

    return true;
  });
}

export function buildPlayerFilterOptions(formOptions: PlayerFormOptions) {
  const batchNames = sortBatchNames([...new Set(formOptions.batches.map((batch) => batch.name))]);

  return {
    sports: [
      { value: "all" as const, label: "All sports" },
      ...formOptions.sports.map((sport) => ({
        value: sport.name,
        label: sport.name,
      })),
    ],
    batches: [
      { value: "all" as const, label: "Batch: All" },
      ...batchNames.map((name) => ({
        value: name,
        label: `Batch: ${name}`,
      })),
    ],
    fees: [
      { value: "all" as const, label: "Fees: All" },
      { value: "paid" as const, label: "Fees: Paid" },
      { value: "due" as const, label: "Fees: Due" },
      { value: "partial" as const, label: "Fees: Partial" },
    ],
    status: [
      { value: "all" as const, label: "Status: All" },
      { value: "active" as const, label: "Status: Active" },
      { value: "on_hold" as const, label: "Status: On hold" },
    ],
  };
}

export function validatePlayerPayload(
  payload: CreatePlayerPayload | UpdatePlayerPayload
): string | null {
  if (!payload.fullName.trim()) return "Player name is required.";
  if (!payload.sportId.trim()) return "Sport is required.";
  if (!payload.batchId?.trim()) return "Batch is required.";
  if (payload.monthlyFeePaise != null && payload.monthlyFeePaise < 0) {
    return "Monthly fee cannot be negative.";
  }
  return null;
}

export function validateCreatePlayerPayload(payload: CreatePlayerPayload): string | null {
  return validatePlayerPayload(payload);
}

export function validateUpdatePlayerPayload(payload: UpdatePlayerPayload): string | null {
  return validatePlayerPayload(payload);
}

const SPORT_EXTERNAL_CODES: Record<string, string> = {
  Wrestling: "WR",
  Boxing: "BX",
  Athletics: "AT",
  Kabaddi: "KB",
  Hockey: "HK",
  Football: "FB",
  Cricket: "CR",
  Judo: "JD",
  Taekwondo: "TK",
  Weightlifting: "WL",
  Badminton: "BD",
  Volleyball: "VB",
};

export function sportExternalCode(sportName: string) {
  const fromMap = SPORT_EXTERNAL_CODES[sportName];
  if (fromMap) return fromMap;

  const derived = sportName.replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase();
  return derived || "PL";
}
