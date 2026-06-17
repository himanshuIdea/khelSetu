import { Suspense } from "react";
import { DashboardCredentialsCard } from "@/components/academy/dashboard/DashboardCredentialsCard";
import { PageBody, PageHeader, StatCard, StatGrid } from "@/components/academy/shared";
import { FeeTrendChart } from "@/components/academy/dashboard/FeeTrendChart";
import { PlayersBySportChart } from "@/components/academy/dashboard/PlayersBySportChart";
import { DashboardBottomPanel } from "@/components/academy/dashboard/DashboardBottomPanel";
import {
  CalendarIcon,
  CashIcon,
  TrophyIcon,
  UpIcon,
  UsersIcon,
} from "@/components/academy/icons";
import {
  ChartRowSkeleton,
  PageHeaderSkeleton,
  SessionsRowSkeleton,
  StatGridSkeleton,
} from "@/components/academy/skeletons";
import {
  buildFeeTrendChart,
  getDashboardStats,
  getFeeCollectionTrend,
  getPlayersBySport,
  getRecentActivity,
  getTodaySessions,
  parseTrendMonths,
  type TrendMonths,
} from "@/lib/repositories/dashboard";
import { resolveAcademy } from "@/lib/repositories/resolve-academy";
import { getCredentialSummary } from "@/lib/repositories/credentials";

const statIcons = [UsersIcon, CashIcon, CalendarIcon, TrophyIcon];

type DashboardHeaderSectionProps = {
  academyId: string;
};

export async function DashboardHeaderSection({ academyId }: DashboardHeaderSectionProps) {
  const academy = await resolveAcademy(academyId);
  const todayLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <PageHeader
      title={`Namaste, ${academy.adminName.split(" ")[0]}`}
      subtitle={`${todayLabel} · Here's how your academy is doing today.`}
    />
  );
}

type DashboardStatsSectionProps = {
  academyId: string;
};

export async function DashboardStatsSection({ academyId }: DashboardStatsSectionProps) {
  const stats = await getDashboardStats(academyId);

  return (
    <StatGrid>
      {stats.map((stat, index) => {
        const Icon = statIcons[index];
        return (
          <StatCard
            key={stat.label}
            value={stat.value}
            label={stat.label}
            icon={<Icon className="w-5 h-5" />}
            iconBg={stat.iconBg}
            iconColor={stat.iconColor}
            delta={
              stat.up ? (
                <span className="text-green flex items-center gap-1">
                  <UpIcon />
                  {stat.delta}
                </span>
              ) : (
                <span className="text-muted">{stat.delta}</span>
              )
            }
          />
        );
      })}
    </StatGrid>
  );
}

type DashboardCredentialsSectionProps = {
  academyId: string;
};

export async function DashboardCredentialsSection({ academyId }: DashboardCredentialsSectionProps) {
  const summary = await getCredentialSummary(academyId);
  const pendingTotal =
    summary.athletes.total -
    summary.athletes.provisioned +
    (summary.coaches.total - summary.coaches.provisioned) +
    (summary.staff.total - summary.staff.provisioned);

  return <DashboardCredentialsCard academyId={academyId} pendingTotal={pendingTotal} />;
}

type DashboardChartsSectionProps = {
  academyId: string;
  trendMonths: TrendMonths;
};

export async function DashboardChartsSection({
  academyId,
  trendMonths,
}: DashboardChartsSectionProps) {
  const [feeTrend, playersBySport] = await Promise.all([
    getFeeCollectionTrend(academyId, trendMonths),
    getPlayersBySport(academyId),
  ]);
  const feeChart = buildFeeTrendChart(feeTrend);
  const activePlayers = playersBySport.reduce((sum, row) => sum + row.count, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-4">
      <FeeTrendChart feeTrend={feeTrend} feeChart={feeChart} trendMonths={trendMonths} />
      <PlayersBySportChart playersBySport={playersBySport} activePlayers={activePlayers} />
    </div>
  );
}

type DashboardSessionsSectionProps = {
  academyId: string;
};

export async function DashboardSessionsSection({ academyId }: DashboardSessionsSectionProps) {
  const [todaySessions, recentActivity] = await Promise.all([
    getTodaySessions(academyId),
    getRecentActivity(academyId),
  ]);

  return (
    <DashboardBottomPanel
      academyId={academyId}
      todaySessions={todaySessions}
      recentActivity={recentActivity}
    />
  );
}

type DashboardPageSectionsProps = {
  academyId: string;
  trendMonths: TrendMonths;
};

export function DashboardPageSections({ academyId, trendMonths }: DashboardPageSectionsProps) {
  return (
    <>
      <Suspense fallback={<PageHeaderSkeleton />}>
        <DashboardHeaderSection academyId={academyId} />
      </Suspense>

      <Suspense fallback={<StatGridSkeleton />}>
        <DashboardStatsSection academyId={academyId} />
      </Suspense>

      <Suspense
        fallback={
          <div className="h-[88px] rounded-2xl bg-line/60 animate-pulse min-w-0 w-full" aria-busy />
        }
      >
        <DashboardCredentialsSection academyId={academyId} />
      </Suspense>

      <Suspense fallback={<ChartRowSkeleton />}>
        <DashboardChartsSection academyId={academyId} trendMonths={trendMonths} />
      </Suspense>

      <Suspense fallback={<SessionsRowSkeleton />}>
        <DashboardSessionsSection academyId={academyId} />
      </Suspense>
    </>
  );
}

export { parseTrendMonths };
