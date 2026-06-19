import type { NurseryVerificationStatus } from "@/lib/state-nurseries";
import { getInitials } from "@/lib/onboarding";
import {
  ACADEMIES_PER_DISTRICT,
  AVATAR_COLORS,
  BATCH_NAMES,
  COACHES_PER_ACADEMY_MAX,
  COACHES_PER_ACADEMY_MIN,
  DISTRICT_CODES,
  FUNDING_TYPES,
  HARYANA_DISTRICTS,
  HARYANA_FEATURED_SPORTS,
  NIS_LEVELS,
  PLAYERS_PER_ACADEMY_MIN,
  PLAYERS_PER_ACADEMY_MAX,
  SPORT_CODES,
  SPORT_COLORS,
  SPORTS_PER_ACADEMY,
  TOTAL_ACADEMIES,
  academySlug,
  districtToSlug,
  academyDisplayName,
  type BatchName,
  type FundingType,
} from "./constants";
import { pickSupportStaffName, pickUniqueNames } from "./names";

export type CoachSpec = {
  fullName: string;
  sport: string;
  roleTitle: string;
  nisLevel: (typeof NIS_LEVELS)[number];
  avatarColor: string;
  rating: string;
  drillsPerWeek: number;
  batchName: BatchName;
};

export type PlayerSpec = {
  externalId: string;
  fullName: string;
  sport: string;
  batch: BatchName;
  weightCategory: string;
  avatarColor: string;
  status: "active" | "on_hold";
  dateOfBirth: Date;
  fee: "paid" | "due" | "partial";
  feePaise?: number;
  rating: string;
  monthlyFeePaise: number;
};

export type StaffSpec = {
  fullName: string;
  roleTitle: string;
  employmentType: "full_time" | "part_time";
  monthlySalaryPaise: number;
  avatarColor: string;
  paid: boolean;
  linkedCoachName?: string;
};

export type AcademySeedSpec = {
  academyIndex: number;
  slug: string;
  name: string;
  district: string;
  state: string;
  fundingType: FundingType;
  brandColor: string;
  initials: string;
  locationLabel: string;
  sports: string[];
  coaches: CoachSpec[];
  players: PlayerSpec[];
  staff: StaffSpec[];
  verificationStatus: NurseryVerificationStatus;
};

export function sportsForAcademy(academyIndex: number): string[] {
  const result: string[] = [];
  for (let j = 0; j < SPORTS_PER_ACADEMY; j++) {
    const sport = HARYANA_FEATURED_SPORTS[(academyIndex * SPORTS_PER_ACADEMY + j) % HARYANA_FEATURED_SPORTS.length];
    if (!result.includes(sport)) {
      result.push(sport);
    }
  }
  while (result.length < SPORTS_PER_ACADEMY) {
    const next =
      HARYANA_FEATURED_SPORTS[(academyIndex * SPORTS_PER_ACADEMY + result.length) % HARYANA_FEATURED_SPORTS.length];
    if (!result.includes(next)) result.push(next);
  }
  return result;
}

export function verificationStatusForAcademy(academyIndex: number): NurseryVerificationStatus {
  const slot = academyIndex % ACADEMIES_PER_DISTRICT;
  if (slot < 3) return "verified";
  if (slot === 3) return "pending";
  return "flagged";
}

/** Deterministic coach roster sizes across academies — never uniform 10. */
export function coachCountForAcademy(academyIndex: number): number {
  const tiers = [
    12, 8, 15, 11, 17, 9, 14, 7, 16, 13, 10, 18, 8, 15, 11, 17, 9, 14, 12, 16,
    7, 13, 10, 18, 11, 15, 9, 17, 14, 8, 16, 12, 10, 15, 7, 13, 18, 11, 9, 14,
  ];
  const base = tiers[academyIndex % tiers.length]!;
  const bump = (academyIndex % 5) - 2;
  return Math.min(
    COACHES_PER_ACADEMY_MAX,
    Math.max(COACHES_PER_ACADEMY_MIN, base + bump)
  );
}

export function expectedTotalCoaches(): number {
  return Array.from({ length: TOTAL_ACADEMIES }, (_, i) => coachCountForAcademy(i)).reduce(
    (sum, count) => sum + count,
    0
  );
}

function distributeCoachCountsAcrossSports(
  total: number,
  sportCount: number,
  academyIndex: number
): number[] {
  if (sportCount === 0 || total === 0) return [];

  const weights = Array.from({ length: sportCount }, (_, i) => 1 + ((academyIndex * 3 + i * 7) % 5));
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
  const counts = weights.map((weight) =>
    Math.max(1, Math.round((total * weight) / weightSum))
  );

  let sum = counts.reduce((acc, count) => acc + count, 0);
  let idx = 0;
  while (sum < total) {
    counts[idx % sportCount]! += 1;
    sum += 1;
    idx += 1;
  }
  while (sum > total && idx < total * sportCount * 2) {
    const slot = idx % sportCount;
    if (counts[slot]! > 1) {
      counts[slot]! -= 1;
      sum -= 1;
    }
    idx += 1;
  }

  return counts;
}

/** Non-alphabetical ingest order — avoids sequential counts when writing to DB. */
export function academyIngestOrder(academyCount: number = TOTAL_ACADEMIES): number[] {
  const order = Array.from({ length: academyCount }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = ((i * 1103515245 + 12345 + academyCount * 7) >>> 0) % (i + 1);
    [order[i], order[j]] = [order[j]!, order[i]!];
  }
  return order;
}

function weightCategoryForSport(sport: string, batch: BatchName, seq: number): string {
  const weights: Record<string, string[]> = {
    Wrestling: ["48kg", "52kg", "57kg", "65kg"],
    Boxing: ["48kg", "54kg", "60kg", "64kg"],
    Athletics: ["100m", "200m", "400m", "800m"],
    Kabaddi: ["Raider", "Defender", "All-rounder", "Raider"],
    Hockey: ["Forward", "Midfield", "Defence", "Goalkeeper"],
    Football: ["Striker", "Midfield", "Defence", "Goalkeeper"],
    Cricket: ["Batsman", "Bowler", "All-rounder", "Wicketkeeper"],
    Judo: ["60kg", "66kg", "73kg", "81kg"],
    Taekwondo: ["54kg", "58kg", "63kg", "68kg"],
    Weightlifting: ["55kg", "61kg", "67kg", "73kg"],
    Badminton: ["Singles", "Doubles", "Mixed", "Singles"],
    Volleyball: ["Setter", "Spiker", "Libero", "Blocker"],
  };
  const options = weights[sport] ?? ["Open"];
  return options[seq % options.length];
}

function dobForBatch(batch: BatchName, seq: number): Date {
  const year =
    batch === "Sub-junior" ? 2012 - (seq % 2) : batch === "Junior" ? 2010 - (seq % 2) : 2008 - (seq % 2);
  const month = (seq % 12) + 1;
  const day = (seq % 27) + 1;
  return new Date(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
}

function feeStatusForPlayer(academyIndex: number, playerIndex: number): "paid" | "due" | "partial" {
  const mod = (academyIndex * 7 + playerIndex) % 10;
  if (mod < 6) return "paid";
  if (mod < 8) return "partial";
  return "due";
}

/** Deterministic roster sizes across academies — never uniform 20. */
export function playerCountForAcademy(academyIndex: number): number {
  const tiers = [
    16, 22, 28, 19, 35, 24, 41, 17, 31, 26, 38, 15, 33, 21, 44, 18, 29, 36, 23, 40,
    27, 32, 20, 37, 25, 42, 16, 30, 34, 19, 39, 22, 28, 45, 17, 31, 24, 36, 21, 43,
  ];
  const base = tiers[academyIndex % tiers.length]!;
  const bump = (academyIndex % 7) - 3;
  return Math.min(
    PLAYERS_PER_ACADEMY_MAX,
    Math.max(PLAYERS_PER_ACADEMY_MIN, base + bump)
  );
}

export function expectedTotalPlayers(): number {
  return Array.from({ length: TOTAL_ACADEMIES }, (_, i) => playerCountForAcademy(i)).reduce(
    (sum, count) => sum + count,
    0
  );
}

function distributePlayerCountsAcrossSports(
  total: number,
  sportCount: number,
  academyIndex: number
): number[] {
  if (sportCount === 0 || total === 0) return [];

  const weights = Array.from({ length: sportCount }, (_, i) => 2 + ((academyIndex + i * 5) % 6));
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
  const counts = weights.map((weight) =>
    Math.max(1, Math.round((total * weight) / weightSum))
  );

  let sum = counts.reduce((acc, count) => acc + count, 0);
  let idx = 0;
  while (sum < total) {
    counts[idx % sportCount]! += 1;
    sum += 1;
    idx += 1;
  }
  while (sum > total && idx < total * sportCount * 2) {
    const slot = idx % sportCount;
    if (counts[slot]! > 1) {
      counts[slot]! -= 1;
      sum -= 1;
    }
    idx += 1;
  }

  return counts;
}

function batchForPlayer(academyIndex: number, playerIndex: number, sportIndex: number): BatchName {
  const pattern: BatchName[] = ["Sub-junior", "Junior", "Senior"];
  return pattern[(academyIndex + playerIndex * 2 + sportIndex) % pattern.length]!;
}

function buildCoaches(academyIndex: number, sports: string[]): CoachSpec[] {
  const totalCoaches = coachCountForAcademy(academyIndex);
  const counts = distributeCoachCountsAcrossSports(totalCoaches, sports.length, academyIndex);
  const names = pickUniqueNames(academyIndex, totalCoaches, 0);
  const coaches: CoachSpec[] = [];
  let nameIdx = 0;

  for (let s = 0; s < sports.length; s++) {
    const sport = sports[s]!;
    const count = counts[s] ?? 1;
    for (let c = 0; c < count; c++) {
      const batchName = BATCH_NAMES[c % BATCH_NAMES.length];
      const isHead = c === 0;
      coaches.push({
        fullName: names[nameIdx]!,
        sport,
        roleTitle: isHead ? `${sport} · Head Coach` : `${sport} · Coach`,
        nisLevel: NIS_LEVELS[(academyIndex + nameIdx) % NIS_LEVELS.length]!,
        avatarColor: AVATAR_COLORS[(academyIndex + nameIdx) % AVATAR_COLORS.length]!,
        rating: (4.2 + ((academyIndex + nameIdx) % 8) * 0.1).toFixed(1),
        drillsPerWeek: 2 + ((academyIndex + nameIdx) % 4),
        batchName,
      });
      nameIdx += 1;
    }
  }

  return coaches;
}

function buildPlayers(academyIndex: number, district: string, sports: string[]): PlayerSpec[] {
  const totalPlayers = playerCountForAcademy(academyIndex);
  const sportCounts = distributePlayerCountsAcrossSports(totalPlayers, sports.length, academyIndex);
  const names = pickUniqueNames(academyIndex, totalPlayers, 500 + academyIndex * 1000);
  const districtCode = DISTRICT_CODES[district] ?? "HR";
  const players: PlayerSpec[] = [];
  let nameIdx = 0;
  let globalSeq = 1;

  for (let sportIndex = 0; sportIndex < sports.length; sportIndex++) {
    const sport = sports[sportIndex]!;
    const countForSport = sportCounts[sportIndex] ?? 0;

    for (let p = 0; p < countForSport; p++) {
      const batch = batchForPlayer(academyIndex, nameIdx, sportIndex);
      const sportCode = SPORT_CODES[sport] ?? "SP";
      const externalId = `${districtCode}${sportCode}-${String(globalSeq).padStart(3, "0")}`;
      const fee = feeStatusForPlayer(academyIndex, nameIdx);
      const monthlyFeePaise = 120000 + ((academyIndex + nameIdx) % 6) * 25000;

      players.push({
        externalId,
        fullName: names[nameIdx]!,
        sport,
        batch,
        weightCategory: weightCategoryForSport(sport, batch, nameIdx),
        avatarColor: AVATAR_COLORS[(academyIndex + nameIdx + sportIndex) % AVATAR_COLORS.length]!,
        status: (academyIndex + nameIdx) % 13 === 0 ? "on_hold" : "active",
        dateOfBirth: dobForBatch(batch, academyIndex + nameIdx + p),
        fee,
        feePaise: fee === "partial" ? Math.floor(monthlyFeePaise * 0.8) : monthlyFeePaise,
        rating: (6.4 + ((academyIndex + nameIdx + sportIndex) % 18) * 0.1).toFixed(1),
        monthlyFeePaise,
      });
      nameIdx += 1;
      globalSeq += 1;
    }
  }

  return players;
}

function buildStaff(academyIndex: number, coaches: CoachSpec[]): StaffSpec[] {
  const sportCoaches = coaches.filter(
    (c, i, arr) => arr.findIndex((x) => x.sport === c.sport) === i
  );

  const staff: StaffSpec[] = sportCoaches.slice(0, 4).map((coach, i) => ({
    fullName: coach.fullName,
    roleTitle: coach.roleTitle.replace(" · ", " · Staff · "),
    employmentType: "full_time" as const,
    monthlySalaryPaise: 3800000 + i * 400000,
    avatarColor: coach.avatarColor,
    paid: i % 2 === 0,
    linkedCoachName: coach.fullName,
  }));

  staff.push(
    {
      fullName: pickSupportStaffName(academyIndex, 0),
      roleTitle: "Physiotherapist",
      employmentType: "part_time",
      monthlySalaryPaise: 2800000,
      avatarColor: AVATAR_COLORS[(academyIndex + 5) % AVATAR_COLORS.length]!,
      paid: false,
    },
    {
      fullName: pickSupportStaffName(academyIndex, 1),
      roleTitle: "Accountant",
      employmentType: "full_time",
      monthlySalaryPaise: 3200000,
      avatarColor: AVATAR_COLORS[(academyIndex + 6) % AVATAR_COLORS.length]!,
      paid: true,
    },
    {
      fullName: pickSupportStaffName(academyIndex, 2),
      roleTitle: "Groundskeeper",
      employmentType: "full_time",
      monthlySalaryPaise: 1800000,
      avatarColor: AVATAR_COLORS[(academyIndex + 7) % AVATAR_COLORS.length]!,
      paid: academyIndex % 3 !== 0,
    }
  );

  return staff;
}

export function buildAcademySpec(academyIndex: number): AcademySeedSpec {
  const districtIndex = Math.floor(academyIndex / ACADEMIES_PER_DISTRICT);
  const slot = academyIndex % ACADEMIES_PER_DISTRICT;
  const district = HARYANA_DISTRICTS[districtIndex]!;
  const sports = sportsForAcademy(academyIndex);
  const primarySport = sports[0]!;
  const slug = academySlug(district, slot);
  const name = academyDisplayName(district, primarySport, slot);
  const fundingType = FUNDING_TYPES[academyIndex % FUNDING_TYPES.length]!;
  const fundingLabel = fundingType === "govt_aided" ? "Govt-aided" : "Private";
  const coaches = buildCoaches(academyIndex, sports);
  const players = buildPlayers(academyIndex, district, sports);
  const staff = buildStaff(academyIndex, coaches);

  return {
    academyIndex,
    slug,
    name,
    district,
    state: "Haryana",
    fundingType,
    brandColor: SPORT_COLORS[primarySport] ?? "#FF6B2C",
    initials: getInitials(name),
    locationLabel: `${district} · ${fundingLabel}`,
    sports,
    coaches,
    players,
    staff,
    verificationStatus: verificationStatusForAcademy(academyIndex),
  };
}

export function buildAllAcademySpecs(): AcademySeedSpec[] {
  const specs = Array.from({ length: TOTAL_ACADEMIES }, (_, i) => buildAcademySpec(i));
  const seen = new Map<string, string>();
  for (const spec of specs) {
    const existingSlug = seen.get(spec.name);
    if (existingSlug) {
      throw new Error(
        `Duplicate academy name "${spec.name}" (slugs ${existingSlug} and ${spec.slug})`
      );
    }
    seen.set(spec.name, spec.slug);
  }
  return specs;
}

export function getAcademyIndexFromSlug(slug: string): number | null {
  for (let d = 0; d < HARYANA_DISTRICTS.length; d++) {
    for (let s = 0; s < ACADEMIES_PER_DISTRICT; s++) {
      if (academySlug(HARYANA_DISTRICTS[d]!, s) === slug) {
        return d * ACADEMIES_PER_DISTRICT + s;
      }
    }
  }
  return null;
}

export { districtToSlug, academySlug, TOTAL_ACADEMIES };
