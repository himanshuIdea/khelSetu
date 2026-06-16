import { PageBody } from "@/components/academy/shared";
import { DashboardWorkspace } from "@/components/academy/DashboardWorkspace";
import {
  buildFeeTrendChart,
  getDashboardData,
  parseTrendMonths,
} from "@/lib/repositories/dashboard";
import { resolveAcademy } from "@/lib/repositories/resolve-academy";

type DashboardPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ months?: string }>;
};

export default async function DashboardPage({ params, searchParams }: DashboardPageProps) {
  const { id } = await params;
  const { months: monthsParam } = await searchParams;
  const trendMonths = parseTrendMonths(monthsParam);

  const [academy, dashboard] = await Promise.all([
    resolveAcademy(id),
    getDashboardData(id, { trendMonths }),
  ]);

  const feeChart = buildFeeTrendChart(dashboard.feeTrend);
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <PageBody>
      <DashboardWorkspace
        academyId={id}
        adminFirstName={academy.adminName.split(" ")[0]}
        todayLabel={today}
        stats={dashboard.stats}
        playersBySport={dashboard.playersBySport}
        todaySessions={dashboard.todaySessions}
        recentActivity={dashboard.recentActivity}
        feeTrend={dashboard.feeTrend}
        feeChart={feeChart}
        trendMonths={trendMonths}
      />
    </PageBody>
  );
}
