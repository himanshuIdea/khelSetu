import { PageBody } from "@/components/academy/shared";
import {
  DashboardPageSections,
  parseTrendMonths,
} from "@/components/academy/dashboard/DashboardSections";

type DashboardPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ months?: string }>;
};

export default async function DashboardPage({ params, searchParams }: DashboardPageProps) {
  const { id } = await params;
  const { months: monthsParam } = await searchParams;
  const trendMonths = parseTrendMonths(monthsParam);

  return (
    <PageBody>
      <DashboardPageSections academyId={id} trendMonths={trendMonths} />
    </PageBody>
  );
}
