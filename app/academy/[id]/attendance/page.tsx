import { CalendarIcon } from "@/components/academy/icons";
import { AttendanceWorkspace } from "@/components/academy/AttendanceWorkspace";
import { PageBody, PageHeader, StatCard, StatGrid } from "@/components/academy/shared";
import {
  getAttendanceFormOptions,
  getAttendanceSessions,
} from "@/lib/repositories/attendance";

type AttendancePageProps = {
  params: Promise<{ id: string }>;
};

export default async function AttendancePage({ params }: AttendancePageProps) {
  const { id } = await params;

  const [formOptions, attendanceSessions] = await Promise.all([
    getAttendanceFormOptions(id),
    getAttendanceSessions(id),
  ]);

  const marked = attendanceSessions.filter((session) => session.status === "Marked");
  const avgRate =
    marked.length > 0
      ? Math.round(
          marked.reduce(
            (sum, session) => sum + (session.present / Math.max(session.total, 1)) * 100,
            0
          ) / marked.length
        )
      : 0;
  const todayIso = new Date().toISOString().slice(0, 10);
  const todayCount = attendanceSessions.filter((session) => session.date === todayIso).length;
  const lowCount = attendanceSessions.filter((session) => session.status === "Low").length;

  const monthLabel = new Date().toLocaleDateString("en-IN", { month: "long" });

  const attendanceStats = [
    {
      value: `${avgRate}%`,
      label: `Avg. attendance · ${monthLabel}`,
      iconBg: "var(--blue-soft)",
      iconColor: "#2756D8",
    },
    {
      value: String(marked.length),
      label: "Sessions marked",
      iconBg: "var(--green-soft)",
      iconColor: "#0E9B72",
    },
    {
      value: String(todayCount),
      label: "Sessions today",
      iconBg: "var(--brand-soft)",
      iconColor: "var(--brand-d)",
    },
    {
      value: String(lowCount),
      label: "Low-attendance batches",
      iconBg: "var(--amber-soft)",
      iconColor: "#C77F12",
      valueColor: "var(--amber)",
    },
  ];

  return (
    <PageBody>
      <AttendanceWorkspace
        academyId={id}
        formOptions={formOptions}
        sessions={attendanceSessions}
      >
        <PageHeader
          title="Attendance"
          subtitle="Mark daily sessions, track batch-wise presence and spot absentees early."
        />

        <StatGrid>
          {attendanceStats.map((stat) => (
            <StatCard
              key={stat.label}
              value={stat.value}
              label={stat.label}
              icon={<CalendarIcon className="w-5 h-5" />}
              iconBg={stat.iconBg}
              iconColor={stat.iconColor}
              valueColor={stat.valueColor}
            />
          ))}
        </StatGrid>
      </AttendanceWorkspace>
    </PageBody>
  );
}
