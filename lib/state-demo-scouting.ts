import type { StateScoutingDashboard } from "@/lib/state-portal";

// Totals: prospects=2419, khelo=185, state camps=1198, national rate=19%
// TODO(demo): remove when live scouting dashboard is ready for recordings

const PROSPECTS_IDENTIFIED = 2419;
const SHORTLISTED_KHELO_INDIA = 185;
const IN_STATE_CAMPS = 1198;
const IN_TRIALS = 576;
const NATIONAL_CAMP = 460;

const pipelineBase = PROSPECTS_IDENTIFIED;

function pipelineStage(
  label: string,
  count: number,
  color: string
): StateScoutingDashboard["pipeline"][number] {
  return {
    label,
    value: count.toLocaleString("en-IN"),
    count,
    percent: Math.round((count / pipelineBase) * 100),
    color,
  };
}

export const STATE_DEMO_SCOUTING_DASHBOARD: StateScoutingDashboard = {
  prospectsIdentified: PROSPECTS_IDENTIFIED,
  shortlistedCount: SHORTLISTED_KHELO_INDIA,
  inCampsCount: IN_STATE_CAMPS,
  nationalCampRate:
    PROSPECTS_IDENTIFIED > 0
      ? Math.round((NATIONAL_CAMP / PROSPECTS_IDENTIFIED) * 100)
      : 0,
  pipeline: [
    pipelineStage("Identified", PROSPECTS_IDENTIFIED, "#FF6B2C"),
    pipelineStage("In trials", IN_TRIALS, "#F5A623"),
    pipelineStage("State camp", IN_STATE_CAMPS, "#2F6BFF"),
    pipelineStage("National camp", NATIONAL_CAMP, "#12B886"),
  ],
  ageGroups: [
    { label: "Sub-junior (U-15)", count: 1024, color: "var(--brand)" },
    { label: "Junior (U-18)", count: 876, color: "var(--blue)" },
    { label: "Senior", count: 519, color: "var(--purple)" },
  ],
  shortlistReportCount: SHORTLISTED_KHELO_INDIA + IN_STATE_CAMPS + NATIONAL_CAMP,
};
