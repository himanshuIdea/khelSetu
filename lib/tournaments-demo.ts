export type CreateTournamentFormValues = {
  name: string;
  venue: string;
  startDate: string;
  endDate: string;
  tournamentType: string;
  sport: string;
  weightClass: string;
  academiesCount: string;
  athletesCount: string;
  description: string;
};

export type DemoTournamentView = {
  name: string;
  location: string;
  dateRange: string;
  participantAcademies: number;
  participantAthletes: number;
  weightClass: string;
  tournamentType: string;
  sport: string;
  description?: string;
};

export type DemoQfMatch = {
  top: string;
  topScore: string;
  bottom: string;
  bottomScore: string;
  winner: "top" | "bottom";
};

export type DemoSfMatch = {
  id: string;
  playerAName: string;
  playerBName: string;
  status?: string;
  winner?: "a" | "b";
};

export type DemoFinalMatch = {
  playerAName: string;
  playerBName: string;
  matLabel?: string;
  winner?: "a" | "b";
};

export type DemoMatScheduleItem = {
  mat: string;
  time: string;
  bout: string;
  variant: "red" | "grey" | "amber";
};

export type DemoMedalTally = {
  gold: number;
  silver: number;
  bronze: number;
};

export type DemoBracketState = {
  qfMatches: DemoQfMatch[];
  sfMatches: DemoSfMatch[];
  finalMatch: DemoFinalMatch;
};

export const DEFAULT_DEMO_QF_MATCHES: DemoQfMatch[] = [
  { top: "R. Sangwan", topScore: "10", bottom: "K. Sheoran", bottomScore: "4", winner: "top" },
  { top: "S. Hooda", topScore: "6", bottom: "A. Dahiya", bottomScore: "2", winner: "top" },
  { top: "D. Malik", topScore: "8", bottom: "P. Rana", bottomScore: "5", winner: "top" },
  { top: "M. Yadav", topScore: "3", bottom: "V. Kadyan", bottomScore: "7", winner: "bottom" },
];

export const DEFAULT_DEMO_SF_MATCHES: DemoSfMatch[] = [
  { id: "sf-1", playerAName: "R. Sangwan", playerBName: "S. Hooda", status: "live" },
  { id: "sf-2", playerAName: "D. Malik", playerBName: "V. Kadyan" },
];

export const DEFAULT_DEMO_FINAL_MATCH: DemoFinalMatch = {
  playerAName: "Winner SF1",
  playerBName: "Winner SF2",
  matLabel: "Mat 1 · Final",
};

/** @deprecated Use DEFAULT_DEMO_QF_MATCHES */
export const DEMO_QF_MATCHES = DEFAULT_DEMO_QF_MATCHES;
/** @deprecated Use DEFAULT_DEMO_SF_MATCHES */
export const DEMO_SF_MATCHES = DEFAULT_DEMO_SF_MATCHES;
/** @deprecated Use DEFAULT_DEMO_FINAL_MATCH */
export const DEMO_FINAL_MATCH = DEFAULT_DEMO_FINAL_MATCH;

export function createDefaultDemoBracket(): DemoBracketState {
  return {
    qfMatches: DEFAULT_DEMO_QF_MATCHES.map((match) => ({ ...match })),
    sfMatches: DEFAULT_DEMO_SF_MATCHES.map((match) => ({ ...match })),
    finalMatch: { ...DEFAULT_DEMO_FINAL_MATCH },
  };
}

export const DEMO_MAT_SCHEDULE: DemoMatScheduleItem[] = [
  {
    mat: "Mat 1 · Live",
    time: "2:30 pm",
    bout: "SF · R. Sangwan vs S. Hooda",
    variant: "red",
  },
  {
    mat: "Mat 2 · Next",
    time: "3:00 pm",
    bout: "SF · D. Malik vs V. Kadyan",
    variant: "grey",
  },
  {
    mat: "Mat 1 · Final",
    time: "4:00 pm",
    bout: "Final · Winner SF1 vs Winner SF2",
    variant: "amber",
  },
];

export const DEMO_MEDAL_TALLY: DemoMedalTally = {
  gold: 3,
  silver: 2,
  bronze: 4,
};

export function buildDemoTournamentView(form: CreateTournamentFormValues): DemoTournamentView {
  const participantAcademies = Number.parseInt(form.academiesCount, 10) || 16;
  const participantAthletes = Number.parseInt(form.athletesCount, 10) || 240;
  const start = form.startDate.trim();
  const end = form.endDate.trim();
  const dateRange =
    start && end ? `${start}–${end}` : start || end || "Dates TBD";

  return {
    name: form.name.trim(),
    location: form.venue.trim(),
    dateRange,
    participantAcademies,
    participantAthletes,
    weightClass: form.weightClass.trim() || "65",
    tournamentType: form.tournamentType.trim() || "Knockout",
    sport: form.sport.trim() || "Wrestling",
    description: form.description.trim() || undefined,
  };
}

export const CREATE_TOURNAMENT_DEFAULTS: CreateTournamentFormValues = {
  name: "Haryana Inter-Academy Wrestling Championship 2026",
  venue: "Sonipat",
  startDate: "12 March 2026",
  endDate: "14 March 2026",
  tournamentType: "Knockout",
  sport: "Wrestling",
  weightClass: "65",
  academiesCount: "16",
  athletesCount: "240",
  description: "",
};
