import { HARYANA_DISTRICTS, HARYANA_FEATURED_SPORTS } from "@/lib/state-catalog";

export { HARYANA_DISTRICTS, HARYANA_FEATURED_SPORTS };

export const BATCH_NAMES = ["Sub-junior", "Junior", "Senior"] as const;
export type BatchName = (typeof BATCH_NAMES)[number];

export const ACADEMIES_PER_DISTRICT = 5;
export const TOTAL_ACADEMIES = HARYANA_DISTRICTS.length * ACADEMIES_PER_DISTRICT;
export const SPORTS_PER_ACADEMY = 4;
/** Legacy baseline — rosters now vary per academy via coachCountForAcademy(). */
export const COACHES_PER_ACADEMY = 10;
export const COACHES_PER_ACADEMY_MIN = 11;
export const COACHES_PER_ACADEMY_MAX = 20;
/** Legacy baseline — rosters now vary per academy via playerCountForAcademy(). */
export const PLAYERS_PER_ACADEMY = 20;
export const PLAYERS_PER_ACADEMY_MIN = 14;
export const PLAYERS_PER_ACADEMY_MAX = 46;

/** One campus label per district slot — keeps academy names unique when primary sport repeats. */
export const ACADEMY_CAMPUS_LABELS = ["City", "Cantt", "North", "South", "Rural"] as const;

export const SPORT_COLORS: Record<string, string> = {
  Wrestling: "#FF6B2C",
  Boxing: "#12B886",
  Athletics: "#2F6BFF",
  Kabaddi: "#F5A623",
  Hockey: "#7C5CFC",
  Football: "#0E9B72",
  Cricket: "#E11D48",
  Judo: "#6443E0",
  Taekwondo: "#2756D8",
  Weightlifting: "#C77F12",
  Badminton: "#0D9488",
  Volleyball: "#DB2777",
};

export const DISTRICT_CODES: Record<string, string> = {
  Ambala: "AMB",
  Bhiwani: "BHI",
  "Charkhi Dadri": "CDD",
  Faridabad: "FBD",
  Fatehabad: "FTB",
  Gurugram: "GGM",
  Hisar: "HSR",
  Jhajjar: "JHJ",
  Jind: "JND",
  Kaithal: "KTL",
  Karnal: "KRN",
  Kurukshetra: "KKR",
  Mahendragarh: "MGH",
  Nuh: "NUH",
  Palwal: "PLW",
  Panchkula: "PCK",
  Panipat: "PNP",
  Rewari: "RWR",
  Rohtak: "RHT",
  Sirsa: "SRS",
  Sonipat: "SNP",
  Yamunanagar: "YMN",
};

export const SPORT_CODES: Record<string, string> = {
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

export const FUNDING_TYPES = ["govt_aided", "private"] as const;
export type FundingType = (typeof FUNDING_TYPES)[number];

export const NIS_LEVELS = ["nis_level_2", "nis_level_1", "in_review"] as const;

export const AVATAR_COLORS = [
  "#FF6B2C",
  "#7C5CFC",
  "#2F6BFF",
  "#12B886",
  "#F5A623",
  "#E11D48",
  "#0E9B72",
  "#2756D8",
  "#6443E0",
  "#C77F12",
] as const;

export function districtToSlug(district: string): string {
  return district.toLowerCase().replace(/\s+/g, "-");
}

export function academySlug(district: string, slot: number): string {
  return `${districtToSlug(district)}-${slot + 1}`;
}

export function academyDisplayName(district: string, primarySport: string, slot: number): string {
  const campus = ACADEMY_CAMPUS_LABELS[slot] ?? `Campus ${slot + 1}`;
  return `${district} ${campus} ${primarySport} Sports Academy`;
}
