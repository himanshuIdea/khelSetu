"use client";

import { useState } from "react";
import {
  ActivityRow,
  EmptyState,
  PageHeader,
  Pill,
  SectionTitle,
  StatCard,
  StatGrid,
} from "@/components/academy/shared";
import { FeeTrendChart } from "@/components/academy/dashboard/FeeTrendChart";
import { PlayersBySportChart } from "@/components/academy/dashboard/PlayersBySportChart";
import { SessionTimetableModal } from "@/components/academy/SessionTimetableModal";
import {
  CalendarIcon,
  CashIcon,
  CheckIcon,
  TrophyIcon,
  UpIcon,
  UsersIcon,
  VideoIcon,
} from "@/components/academy/icons";
import type { FeeTrendChart as FeeTrendChartData, FeeTrendPoint, TrendMonths } from "@/lib/repositories/dashboard";

const statIcons = [UsersIcon, CashIcon, CalendarIcon, TrophyIcon];

type DashboardStat = {
  value: string;
  label: string;
  delta: string;
  iconBg: string;
  iconColor: string;
  up: boolean;
};

type TodaySession = {
  id: string;
  time: string;
  title: string;
  coach: string;
  pill: string;
  pillVariant: "amber" | "green" | "grey";
};

type RecentActivityItem = {
  id: string;
  bold: string;
  text: string;
  time: string;
  type: "check" | "video" | "users";
  prefix: boolean;
};

type DashboardWorkspaceProps = {
  academyId: string;
  adminFirstName: string;
  todayLabel: string;
  stats: DashboardStat[];
  playersBySport: { sport: string; color: string; count: number }[];
  todaySessions: TodaySession[];
  recentActivity: RecentActivityItem[];
  feeTrend: FeeTrendPoint[];
  feeChart: FeeTrendChartData;
  trendMonths: TrendMonths;
};

export function DashboardWorkspace({
  academyId,
  adminFirstName,
  todayLabel,
  stats,
  playersBySport,
  todaySessions,
  recentActivity,
  feeTrend,
  feeChart,
  trendMonths,
}: DashboardWorkspaceProps) {
  const activePlayers = Number(stats[0]?.value ?? 0);
  const [timetableOpen, setTimetableOpen] = useState(false);

  return (
    <>
      <PageHeader
        title={`Namaste, ${adminFirstName}`}
        subtitle={`${todayLabel} · Here's how your academy is doing today.`}
      />

      <StatGrid>
        {stats.map((stat, i) => {
          const Icon = statIcons[i];
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

      <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-4">
        <FeeTrendChart feeTrend={feeTrend} feeChart={feeChart} trendMonths={trendMonths} />
        <PlayersBySportChart playersBySport={playersBySport} activePlayers={activePlayers} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-4 mt-4">
        <button
          type="button"
          onClick={() => setTimetableOpen(true)}
          className="bg-card border border-line rounded-(--radius) px-5 py-4 text-left w-full cursor-pointer transition-colors hover:border-brand/35 hover:bg-surface/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 flex flex-col min-h-0"
        >
          <SectionTitle title="Today's sessions" />
          {todaySessions.length === 0 ? (
            <EmptyState
              compact
              className="border-none shadow-none bg-transparent mt-1 pointer-events-none"
              icon={<CalendarIcon className="w-5 h-5" />}
              title="No sessions scheduled"
              description="Batch sessions for today will appear here once your timetable is set up."
            />
          ) : (
            <div className="mt-1 max-h-[min(320px,45vh)] overflow-y-auto overscroll-y-contain -mx-1 px-1">
              {todaySessions.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 py-[11px] border-t border-line2 first:border-t-0 pointer-events-none"
                >
                  <div className="text-xs font-bold text-ink sm:w-[62px]">{s.time}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[13px]">{s.title}</div>
                    <div className="text-[11.5px] text-muted">{s.coach}</div>
                  </div>
                  <Pill variant={s.pillVariant} className="self-start sm:self-auto">
                    {s.pill}
                  </Pill>
                </div>
              ))}
            </div>
          )}
        </button>

        <div className="bg-card border border-line rounded-(--radius) px-5 py-4">
          <SectionTitle title="Recent activity" />
          {recentActivity.length === 0 ? (
            <EmptyState
              compact
              className="border-none shadow-none bg-transparent mt-1"
              icon={<CheckIcon className="w-5 h-5" />}
              title="No recent activity"
              description="Player onboarding, fee payments and attendance updates will show up here."
            />
          ) : (
            recentActivity.map((a) => {
              const icons = { check: CheckIcon, video: VideoIcon, users: UsersIcon };
              const colors = {
                check: { bg: "var(--green-soft)", color: "#0E9B72" },
                video: { bg: "var(--brand-soft)", color: "var(--brand-d)" },
                users: { bg: "var(--blue-soft)", color: "#2756D8" },
              };
              const Icon = icons[a.type];
              const c = colors[a.type];
              return (
                <ActivityRow
                  key={a.id}
                  icon={<Icon />}
                  iconBg={c.bg}
                  iconColor={c.color}
                  text={
                    a.prefix ? (
                      <>
                        {a.text} <b className="font-semibold text-ink">{a.bold}</b>
                      </>
                    ) : (
                      <>
                        <b className="font-semibold text-ink">{a.bold}</b> {a.text}
                      </>
                    )
                  }
                  time={a.time}
                />
              );
            })
          )}
        </div>
      </div>

      <SessionTimetableModal
        academyId={academyId}
        open={timetableOpen}
        onClose={() => setTimetableOpen(false)}
      />
    </>
  );
}
