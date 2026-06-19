import {
  CapIcon,
  CashIcon,
  ChartIcon,
  FlagIcon,
  GridIcon,
  ShieldIcon,
  TrophyIcon,
  UsersIcon,
} from "@/components/academy/icons";
import { EmptyState } from "@/components/academy/shared";

export type StateEmptyScreen =
  | "overview-districts"
  | "overview-talent"
  | "overview-verification"
  | "overview-funds"
  | "athletes"
  | "districts"
  | "scouting"
  | "scouting-prospects"
  | "verification"
  | "funds-schemes"
  | "funds-tokens"
  | "reports"
  | "onboarding-requests"
  | "nurseries";

type EmptyPreset = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

const ICON_CLASS = "w-5 h-5";

export const stateEmptyPresets: Record<StateEmptyScreen, EmptyPreset> = {
  "overview-districts": {
    icon: <GridIcon className={ICON_CLASS} />,
    title: "No district breakdown yet",
    description:
      "Athlete counts by district and sport appear once nurseries register athletes statewide.",
  },
  "overview-talent": {
    icon: <TrophyIcon className={ICON_CLASS} />,
    title: "No talent pipeline entries",
    description:
      "Flagged athletes for Khelo India shortlisting will show here when performance data is available.",
  },
  "overview-verification": {
    icon: <ShieldIcon className={ICON_CLASS} />,
    title: "No verification data",
    description:
      "Nursery verification status appears after academies complete onboarding and state review.",
  },
  "overview-funds": {
    icon: <CashIcon className={ICON_CLASS} />,
    title: "No fund utilisation data",
    description:
      "Scheme-wise disbursement and utilisation charts populate once DBT payments are recorded.",
  },
  athletes: {
    icon: <UsersIcon className={ICON_CLASS} />,
    title: "No athletes tracked yet",
    description:
      "Registered athletes from verified nurseries and academies appear here with KhelSetu scores.",
  },
  districts: {
    icon: <GridIcon className={ICON_CLASS} />,
    title: "No district data yet",
    description:
      "District-level nursery, athlete, and coach counts appear once statewide registration begins.",
  },
  scouting: {
    icon: <TrophyIcon className={ICON_CLASS} />,
    title: "No scouting data yet",
    description:
      "Talent scouting metrics and pipeline stages populate from live athlete performance across Haryana.",
  },
  "scouting-prospects": {
    icon: <UsersIcon className={ICON_CLASS} />,
    title: "No prospects this quarter",
    description:
      "Top-ranked athletes by KhelSetu score appear here when scouting filters match performance data.",
  },
  verification: {
    icon: <ShieldIcon className={ICON_CLASS} />,
    title: "No nurseries to verify",
    description:
      "Submitted academies and nurseries awaiting or completed verification review appear in this list.",
  },
  "funds-schemes": {
    icon: <CashIcon className={ICON_CLASS} />,
    title: "No scheme disbursements yet",
    description:
      "Allocated vs disbursed amounts by scheme show here once fund releases are processed via DBT.",
  },
  "funds-tokens": {
    icon: <CashIcon className={ICON_CLASS} />,
    title: "No purpose-locked tokens issued",
    description:
      "Diet, gear, and travel tokens for beneficiaries appear here after monthly token issuance.",
  },
  reports: {
    icon: <ChartIcon className={ICON_CLASS} />,
    title: "No reports available",
    description:
      "Scheduled and on-demand state reports appear here once analytics exports are configured.",
  },
  "onboarding-requests": {
    icon: <CapIcon className={ICON_CLASS} />,
    title: "No onboarding requests yet",
    description:
      "Academy admins submit verification requests here when registering a new sports nursery.",
  },
  nurseries: {
    icon: <CapIcon className={ICON_CLASS} />,
    title: "No active nurseries yet",
    description:
      "Approved academy onboarding requests and manually registered nurseries appear here.",
  },
};

/** Compact empty UI inside an existing card or panel. */
export function StateSectionEmpty({
  screen,
  title,
  description,
  icon,
}: {
  screen?: StateEmptyScreen;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}) {
  const preset = screen ? stateEmptyPresets[screen] : null;

  return (
    <div className="text-center py-8 px-4">
      {(icon ?? preset?.icon) && (
        <div className="w-9 h-9 rounded-[10px] bg-surface text-muted2 flex items-center justify-center mx-auto mb-2.5">
          {icon ?? preset?.icon}
        </div>
      )}
      <div className="text-[13px] font-semibold text-ink">{title ?? preset?.title}</div>
      {(description ?? preset?.description) && (
        <p className="text-[11.5px] text-muted mt-1 max-w-[300px] mx-auto leading-relaxed">
          {description ?? preset?.description}
        </p>
      )}
    </div>
  );
}

/** Full-width empty state for primary list/table content on a page. */
export function StateListEmpty({
  screen,
  title,
  description,
  icon,
  action,
  compact = false,
}: {
  screen: StateEmptyScreen;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  compact?: boolean;
}) {
  const preset = stateEmptyPresets[screen];

  return (
    <EmptyState
      compact={compact}
      icon={icon ?? preset.icon}
      title={title ?? preset.title}
      description={description ?? preset.description}
      action={action}
    />
  );
}

/** Empty state when filters yield no matches but source data exists. */
export function StateFilteredEmpty({
  entity = "results",
  description,
}: {
  entity?: string;
  description?: string;
}) {
  return (
    <EmptyState
      compact
      icon={<FlagIcon className={ICON_CLASS} />}
      title={`No ${entity} match these filters`}
      description={description ?? "Try changing or clearing your filters."}
    />
  );
}
