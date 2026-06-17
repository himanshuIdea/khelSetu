"use client";

import { useState } from "react";
import {
  ActivityRow,
  EmptyState,
  Pill,
  SectionTitle,
} from "@/components/academy/shared";
import { SessionTimetableModal } from "@/components/academy/SessionTimetableModal";
import {
  CalendarIcon,
  CheckIcon,
  UsersIcon,
  VideoIcon,
} from "@/components/academy/icons";

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

type DashboardBottomPanelProps = {
  academyId: string;
  todaySessions: TodaySession[];
  recentActivity: RecentActivityItem[];
};

export function DashboardBottomPanel({
  academyId,
  todaySessions,
  recentActivity,
}: DashboardBottomPanelProps) {
  const [timetableOpen, setTimetableOpen] = useState(false);

  return (
    <>
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
              {todaySessions.map((session) => (
                <div
                  key={session.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 py-[11px] border-t border-line2 first:border-t-0 pointer-events-none"
                >
                  <div className="text-xs font-bold text-ink sm:w-[62px]">{session.time}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[13px]">{session.title}</div>
                    <div className="text-[11.5px] text-muted">{session.coach}</div>
                  </div>
                  <Pill variant={session.pillVariant} className="self-start sm:self-auto">
                    {session.pill}
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
            recentActivity.map((activity) => {
              const icons = { check: CheckIcon, video: VideoIcon, users: UsersIcon };
              const colors = {
                check: { bg: "var(--green-soft)", color: "#0E9B72" },
                video: { bg: "var(--brand-soft)", color: "var(--brand-d)" },
                users: { bg: "var(--blue-soft)", color: "#2756D8" },
              };
              const Icon = icons[activity.type];
              const color = colors[activity.type];
              return (
                <ActivityRow
                  key={activity.id}
                  icon={<Icon />}
                  iconBg={color.bg}
                  iconColor={color.color}
                  text={
                    activity.prefix ? (
                      <>
                        {activity.text} <b className="font-semibold text-ink">{activity.bold}</b>
                      </>
                    ) : (
                      <>
                        <b className="font-semibold text-ink">{activity.bold}</b> {activity.text}
                      </>
                    )
                  }
                  time={activity.time}
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
